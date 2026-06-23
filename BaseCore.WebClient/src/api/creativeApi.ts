import axiosClient from './axiosClient';

export interface CreativePost {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  canEdit?: boolean;
}

export const creativeApi = {
  getAll: async (): Promise<CreativePost[]> => {
    const res = await axiosClient.get<CreativePost[]>('/CreativePosts');
    return res.data;
  },
  create: async (data: { content: string; imageUrl?: string }) => {
    const res = await axiosClient.post('/CreativePosts', data);
    return res.data;
  },
  update: async (id: number, data: { content: string; imageUrl?: string }) => {
    const res = await axiosClient.put(`/CreativePosts/${id}`, data);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await axiosClient.delete(`/CreativePosts/${id}`);
    return res.data;
  },
  uploadImage: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axiosClient.post<{ url: string }>('/Image/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
