import axiosClient from './axiosClient';

export interface AddressResponse {
  id: number;
  receiverName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
  fullAddress: string;
}

export const addressApi = {
  getAll: async (): Promise<AddressResponse[]> => {
    const res = await axiosClient.get('/Address');
    return res.data;
  },
  create: async (data: Omit<AddressResponse, 'id' | 'fullAddress'>) => {
    const res = await axiosClient.post('/Address', data);
    return res.data;
  },
  update: async (id: number, data: Omit<AddressResponse, 'id' | 'fullAddress'>) => {
    const res = await axiosClient.put(`/Address/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await axiosClient.delete(`/Address/${id}`);
    return res.data;
  },
  setDefault: async (id: number) => {
    const res = await axiosClient.put(`/Address/${id}/default`);
    return res.data;
  },
};