import axiosClient from './axiosClient';

export const settingsApi = {
  getAll: async () => {
    const res = await axiosClient.get('/Settings');
    return res.data;
  },
  updateMany: async (settings: { id: number; value: string }[]) => {
    const res = await axiosClient.put('/Settings', settings);
    return res.data;
  },
};
