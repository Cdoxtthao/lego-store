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

  updateStatus: async (id: number, status: string, reason?: string) => {
    const url = `/Orders/${id}/status${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`;
    const res = await axiosClient.put(url, JSON.stringify(status));
    return res.data;
  },
  cancelOrder: async (id: number, reason?: string) => {
    const url = `/Orders/${id}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`;
    const res = await axiosClient.put(url);
    return res.data;
  },
  receiveOrder: async (id: number) => {
    const res = await axiosClient.put(`/Orders/${id}/receive`);
    return res.data;
  },
  // Chỉ Admin — xóa mềm đơn hàng
  softDelete: async (id: number) => {
    const res = await axiosClient.delete(`/Orders/${id}`);
    return res.data;
  },
};