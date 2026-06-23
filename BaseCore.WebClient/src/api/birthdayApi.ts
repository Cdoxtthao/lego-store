import axiosClient from './axiosClient';

export interface ChildProfile {
  id: number;
  name?: string | null;
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
}

export interface BirthdayInfo {
  editCount: number;
  rewardReceived: boolean;
  canEdit: boolean;
  children: ChildProfile[];
}

export interface ChildRequest {
  name?: string;
  gender?: string;
  age?: number;
  birthDate?: string;
}

export const birthdayApi = {
  getMine: async (): Promise<BirthdayInfo> => {
    const res = await axiosClient.get<BirthdayInfo>('/Birthday');
    return res.data;
  },
  addChild: async (data: ChildRequest) => {
    const res = await axiosClient.post('/Birthday/children', data);
    return res.data;
  },
  updateChild: async (id: number, data: ChildRequest) => {
    const res = await axiosClient.put(`/Birthday/children/${id}`, data);
    return res.data;
  },
  deleteChild: async (id: number) => {
    const res = await axiosClient.delete(`/Birthday/children/${id}`);
    return res.data;
  },
};
