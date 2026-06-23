import axiosClient from './axiosClient';

export interface CampaignConfig {
  title: string;
  banner: string;
  sideBanner?: string;
  endDate?: string;
  productIds: string;   // "1,2,3"
}

export const campaignApi = {
  get: async (): Promise<CampaignConfig> => (await axiosClient.get('/Campaign')).data,
  update: async (data: Partial<CampaignConfig>) => (await axiosClient.put('/Campaign', data)).data,
  uploadBanner: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axiosClient.post<{ url: string }>('/Image/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
