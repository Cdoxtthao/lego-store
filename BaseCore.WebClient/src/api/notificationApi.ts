import axiosClient from './axiosClient';

export interface NotificationDto {
  id: number;
  type: string;
  orderId?: number | null;
  status?: string | null;
  title: string;
  message: string;
  imageUrl?: string | null;
  reason?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getMy: async (take = 50): Promise<NotificationDto[]> => {
    const res = await axiosClient.get<NotificationDto[]>(`/Notifications/my?take=${take}`);
    return res.data;
  },

  unreadCount: async (): Promise<number> => {
    const res = await axiosClient.get<{ count: number }>('/Notifications/unread-count');
    return res.data.count;
  },

  markRead: async (id: number) => {
    const res = await axiosClient.put(`/Notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await axiosClient.put('/Notifications/read-all');
    return res.data;
  },

  remove: async (id: number) => {
    const res = await axiosClient.delete(`/Notifications/${id}`);
    return res.data;
  },

  clearAll: async () => {
    const res = await axiosClient.delete('/Notifications');
    return res.data;
  },
};
