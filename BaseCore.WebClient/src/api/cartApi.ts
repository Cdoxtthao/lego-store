import axiosClient from './axiosClient';
import { CartResponse, OrderResponse } from '../types';

export const cartApi = {
  getCart: async (): Promise<CartResponse | null> => {
    const res = await axiosClient.get<CartResponse>('/Cart');
    return res.data;
  },

  addToCart: async (productId: number, quantity: number = 1): Promise<CartResponse> => {
    const res = await axiosClient.post<CartResponse>('/Cart', { productId, quantity });
    return res.data;
  },

  updateQuantity: async (cartItemId: number, quantity: number): Promise<CartResponse> => {
    const res = await axiosClient.put<CartResponse>(`/Cart/${cartItemId}`, quantity);
    return res.data;
  },

  removeItem: async (cartItemId: number): Promise<CartResponse> => {
    const res = await axiosClient.delete<CartResponse>(`/Cart/${cartItemId}`);
    return res.data;
  },

  clearCart: async (): Promise<void> => {
    await axiosClient.delete('/Cart');
  },

  checkout: async (
    shippingAddress: string,
    paymentMethod: string,
    selectedItemIds: number[],
    note?: string,
    giftFee?: number,
    giftNote?: string,
    shippingFee?: number,
    voucherCode?: string,
  ) => {
    const res = await axiosClient.post<OrderResponse>('/Cart/checkout', {
      shippingAddress,
      paymentMethod,
      selectedItemIds,
      note,
      giftFee: giftFee ?? 0,
      giftNote,
      shippingFee: shippingFee ?? 0,
      voucherCode,
    });
    return res.data;
  },
};