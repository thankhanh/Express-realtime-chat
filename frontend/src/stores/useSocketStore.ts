import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // ── Online Users ────────────────────────────────────────
    socket.on("online-users", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    // ── New Message ─────────────────────────────────────────
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (
        useChatStore.getState().activeConversationId === message.conversationId
      ) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // ── Delete / Thu hồi Message ────────────────────────────
    socket.on(
      "delete-message",
      ({
        messageId,
        conversationId,
      }: {
        messageId: string;
        conversationId: string;
      }) => {
        useChatStore.getState().deleteMessageLocally(messageId, conversationId);
      }
    );

    // ── Read Message ────────────────────────────────────────
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // ── New Group ───────────────────────────────────────────
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // ── Typing Indicator ────────────────────────────────────
    socket.on(
      "user-typing",
      ({
        userId,
        displayName,
        conversationId,
      }: {
        userId: string;
        displayName: string;
        conversationId: string;
      }) => {
        useChatStore.getState().setTypingUser(conversationId, { userId, displayName });
      }
    );

    socket.on(
      "user-stop-typing",
      ({
        userId,
        conversationId,
      }: {
        userId: string;
        conversationId: string;
      }) => {
        useChatStore.getState().removeTypingUser(conversationId, userId);
      }
    );

    // ── Group Management ────────────────────────────────────
    socket.on(
      "member-left",
      ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        useChatStore.getState().updateConversation({
          _id: conversationId,
          // Lọc participant rời đi (cập nhật minimal, fetchConversations sẽ refresh)
          _memberLeft: userId,
        });
        // Refresh danh sách conversations để đồng bộ participants
        useChatStore.getState().fetchConversations();
      }
    );

    socket.on("member-added", () => {
      useChatStore.getState().fetchConversations();
    });

    socket.on("added-to-group", ({ conversationId }: { conversationId: string }) => {
      useChatStore.getState().fetchConversations();
      socket.emit("join-conversation", conversationId);
    });

    socket.on("member-removed", () => {
      useChatStore.getState().fetchConversations();
    });

    socket.on(
      "group-updated",
      ({
        conversationId,
        name,
      }: {
        conversationId: string;
        name: string;
      }) => {
        useChatStore.getState().updateConversation({
          _id: conversationId,
          group: { name },
        });
      }
    );

    socket.on(
      "conversation-deleted",
      ({ conversationId }: { conversationId: string }) => {
        useChatStore.getState().removeConversationLocally(conversationId);
      }
    );
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
