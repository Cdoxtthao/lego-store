import axiosClient from './axiosClient';
import { OrderResponse, PagedResponse } from '../types';

export const orderApi = {
  getAll: async (page = 1, pageSize = 10, status?: string): Promise<PagedResponse<OrderResponse>> => {
    const res = await axiosClient.get('/Orders', { params: { page, pageSize, status } });
    return res.data;
  },

  getMyOrders: async (): Promise<OrderResponse[]> => {
    const res = await axiosClient.get('/Orders/my');
    return res.data;
  },

  updateStatus: async (id: number, status: string) => {
    const res = await axiosClient.put(`/Orders/${id}/status`, JSON.stringify(status));
    return res.data;
  },
  cancelOrder: async (id: number) => {
    const res = await axiosClient.put(`/Orders/${id}/cancel`);
    return res.data;
  },
};