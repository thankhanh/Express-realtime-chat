import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.status === 400) throw new Error(res.data.message);
    return res.data;
  },

  updateProfile: async (data: { displayName?: string; bio?: string; phone?: string }) => {
    const res = await api.patch("/users/profile", data);
    return res.data;
  },

  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const res = await api.patch("/users/change-password", data);
    return res.data;
  },

  blockUser: async (targetUserId: string) => {
    const res = await api.post(`/users/block/${targetUserId}`);
    return res.data;
  },

  unblockUser: async (targetUserId: string) => {
    const res = await api.delete(`/users/block/${targetUserId}`);
    return res.data;
  },

  getBlockedUsers: async () => {
    const res = await api.get("/users/blocked");
    return res.data;
  },

  deleteAccount: async (password: string) => {
    const res = await api.delete("/users/account", { data: { password } });
    return res.data;
  },
};

