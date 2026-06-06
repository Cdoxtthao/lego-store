import axiosClient from './axiosClient';

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
}

export const categoryApi = {
  getAll: async (): Promise<CategoryResponse[]> => {
    const res = await axiosClient.get('/Categories');
    return res.data;
  },
  create: async (data: { name: string; description?: string; imageUrl?: string }) => {
    const res = await axiosClient.post('/Categories', data);
    return res.data;
  },
  update: async (id: number, data: { name: string; description?: string; imageUrl?: string }) => {
    const res = await axiosClient.put(`/Categories/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await axiosClient.delete(`/Categories/${id}`);
    return res.data;
  },
};