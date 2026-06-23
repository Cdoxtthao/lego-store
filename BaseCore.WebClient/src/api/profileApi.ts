import axiosClient from './axiosClient';

export const profileApi = {
  getMe: async () => {
    const res = await axiosClient.get('/Users/me');
    return res.data;
  },

  updateMe: async (data: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    avatarUrl?: string;
  }) => {
    const res = await axiosClient.put('/Users/me', data);
    return res.data;
  },

  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const res = await axiosClient.put('/Users/me/password', data);
    return res.data;
  },

  getCustomers: async (): Promise<{ id: number; fullName: string; email: string }[]> => {
    const res = await axiosClient.get('/Users/customers');
    return res.data;
  },
};