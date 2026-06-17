import axiosClient from './axiosClient';
import { ReviewResponse } from '../types';

export const reviewApi = {
  getByProduct: async (productId: number): Promise<ReviewResponse[]> => {
    const res = await axiosClient.get<ReviewResponse[]>(`/Reviews/product/${productId}`);
    return res.data;
  },

  create: async (request: { productId: number; rating: number; comment?: string }) => {
    const res = await axiosClient.post('/Reviews', request);
    return res.data;
  },
};
