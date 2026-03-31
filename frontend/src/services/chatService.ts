import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 50;

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`
    );
    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    imgUrl?: string,
    conversationId?: string,
    replyTo?: string
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
      replyTo,
    });
    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string,
    replyTo?: string
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
      replyTo,
    });
    return res.data.message;
  },

  // Gửi ảnh trong chat (multipart/form-data lên backend → Cloudinary)
  async sendImageMessage(
    file: File,
    conversationId?: string,
    recipientId?: string
  ) {
    const formData = new FormData();
    formData.append("image", file);
    if (conversationId) formData.append("conversationId", conversationId);
    if (recipientId) formData.append("recipientId", recipientId);

    const res = await api.post("/messages/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.message;
  },

  // Thu hồi tin nhắn (soft delete)
  async deleteMessage(messageId: string) {
    await api.delete(`/messages/${messageId}`);
  },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },

  // Rời nhóm
  async leaveGroup(conversationId: string) {
    await api.patch(`/conversations/${conversationId}/leave`);
  },

  // Đổi tên nhóm
  async updateGroup(conversationId: string, name: string) {
    const res = await api.patch(`/conversations/${conversationId}`, { name });
    return res.data.conversation;
  },

  // Thêm thành viên vào nhóm
  async addGroupMembers(conversationId: string, memberIds: string[]) {
    const res = await api.patch(`/conversations/${conversationId}/members/add`, {
      memberIds,
    });
    return res.data;
  },

  // Xóa thành viên khỏi nhóm
  async removeGroupMember(conversationId: string, memberId: string) {
    await api.delete(`/conversations/${conversationId}/members/${memberId}`);
  },
};
