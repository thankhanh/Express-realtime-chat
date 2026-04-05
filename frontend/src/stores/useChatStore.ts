import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false,
      messageLoading: false,
      loading: false,
      replyingMessage: null,
      typingUsers: {}, // { conversationId: [{ userId, displayName }] }

      setActiveConversation: (id) => set({ activeConversationId: id }),

      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
          replyingMessage: null,
          typingUsers: {},
        });
      },

      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();
          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations:", error);
          set({ convoLoading: false });
        }
      },

      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;
        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },

      sendDirectMessage: async (recipientId, content, imgUrl, replyTo) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined,
            replyTo
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },

      sendGroupMessage: async (conversationId, content, imgUrl, replyTo) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgUrl, replyTo);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
        }
      },

      // Gửi ảnh trong chat
      sendImageMessage: async (file, conversationId, recipientId) => {
        try {
          const { activeConversationId } = get();
          const convoId = conversationId ?? activeConversationId ?? undefined;
          await chatService.sendImageMessage(file, convoId, recipientId);
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi ảnh", error);
          throw error;
        }
      },

      // Thu hồi tin nhắn
      deleteMessage: async (messageId, conversationId) => {
        try {
          await chatService.deleteMessage(messageId);
          // Cập nhật local state ngay (optimistic update)
          get().deleteMessageLocally(messageId, conversationId);
        } catch (error) {
          console.error("Lỗi xảy ra khi thu hồi tin nhắn", error);
          throw error;
        }
      },

      // Cập nhật local khi nhận socket event "delete-message"
      deleteMessageLocally: (messageId, conversationId) => {
        set((state) => {
          const existing = state.messages[conversationId];
          if (!existing) return state;

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...existing,
                items: existing.items.map((m) =>
                  m._id === messageId
                    ? { ...m, isDeleted: true, content: null, imgUrl: null }
                    : m
                ),
              },
            },
          };
        });
      },

      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;
          let prevItems = get().messages[convoId]?.items ?? [];

          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[convoId].hasMore,
                  nextCursor: state.messages[convoId].nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy khi ra add message:", error);
        }
      },

      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            c._id === (conversation as any)._id ? { ...c, ...(conversation as any) } : c
          ),
        }));
      },

      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) return;

          const convo = conversations.find((c) => c._id === activeConversationId);
          if (!convo) return;

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) return;

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: 0,
                    },
                  }
                : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        }
      },

      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          return {
            conversations: exists
              ? state.conversations
              : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },

      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds
          );

          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
        } finally {
          set({ loading: false });
        }
      },

      setReplyingMessage: (message) => {
        set({ replyingMessage: message });
      },

      clearReplyingMessage: () => {
        set({ replyingMessage: null });
      },

      // Typing indicator — thêm user đang nhập
      setTypingUser: (conversationId, user) => {
        set((state) => {
          const current = state.typingUsers[conversationId] ?? [];
          // Không thêm nếu đã có
          if (current.some((u) => u.userId === user.userId)) return state;
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [...current, user],
            },
          };
        });
      },

      // Typing indicator — xóa user khi dừng nhập
      removeTypingUser: (conversationId, userId) => {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: (state.typingUsers[conversationId] ?? []).filter(
              (u) => u.userId !== userId
            ),
          },
        }));
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
