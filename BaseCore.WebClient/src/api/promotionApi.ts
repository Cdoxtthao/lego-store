import axiosClient from './axiosClient';

export interface PromotionResponse {
  id: number;
  name: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
}

export interface PromotionRequest {
  name: string;
  description?: string;
  discountPercent: number;
  startDate: string;   // ISO yyyy-MM-dd
  endDate: string;
  isActive: boolean;
}

export const promotionApi = {
  getAll: async (): Promise<PromotionResponse[]> => {
    const res = await axiosClient.get<PromotionResponse[]>('/Promotions');
    return res.data;
  },
  create: async (data: PromotionRequest) => (await axiosClient.post('/Promotions', data)).data,
  update: async (id: number, data: PromotionRequest) => (await axiosClient.put(`/Promotions/${id}`, data)).data,
  toggle: async (id: number) => (await axiosClient.put(`/Promotions/${id}/toggle`)).data,
  remove: async (id: number) => (await axiosClient.delete(`/Promotions/${id}`)).data,
};
