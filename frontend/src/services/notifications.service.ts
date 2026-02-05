import api from "@/lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "email" | "sms" | "in_app" | "push";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
