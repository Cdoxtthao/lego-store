import axiosClient from './axiosClient';

export const wishlistApi = {
  getAll: async () => {
    const res = await axiosClient.get('/Wishlist');
    return res.data;
  },

  add: async (productId: number) => {
    const res = await axiosClient.post(`/Wishlist/${productId}`);
    return res.data;
  },

  remove: async (productId: number) => {
    const res = await axiosClient.delete(`/Wishlist/${productId}`);
    return res.data;
  },

  check: async (productId: number) => {
    const res = await axiosClient.get(`/Wishlist/check/${productId}`);
    return res.data;
  },

  getCount: async () => {
    const res = await axiosClient.get('/Wishlist/count');
    return res.data;
  },
};
