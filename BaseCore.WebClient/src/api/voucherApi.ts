import axiosClient from './axiosClient';

export interface Voucher {
  id: number;
  code: string;
  description?: string | null;
  discountPercent: number;
  scopeType: string;        // All | Specific | Birthday
  categoryIds?: string | null;
  themeIds?: string | null;
  productIds?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface MyVoucher {
  userVoucherId: number;
  isUsed: boolean;
  voucher: Voucher;
}

export interface VoucherRequest {
  code: string;
  description?: string;
  discountPercent: number;
  scopeType: string;
  categoryIds?: string;
  themeIds?: string;
  productIds?: string;
  startDate?: string;
  endDate?: string;
}

export interface VoucherApplyResult {
  valid: boolean;
  discount: number;
  voucherId: number;
  message: string;
}

export interface CustomerLite { id: number; name: string; email: string; }

export const voucherApi = {
  getAll: async (): Promise<Voucher[]> => (await axiosClient.get('/Vouchers')).data,
  getActive: async (): Promise<Voucher[]> => (await axiosClient.get('/Vouchers/active')).data,
  getMine: async (): Promise<MyVoucher[]> => (await axiosClient.get('/Vouchers/my')).data,
  create: async (data: VoucherRequest) => (await axiosClient.post('/Vouchers', data)).data,
  remove: async (id: number) => (await axiosClient.delete(`/Vouchers/${id}`)).data,
  redeem: async (code: string) => (await axiosClient.post('/Vouchers/redeem', { code })).data,
  send: async (voucherId: number, userId: number) =>
    (await axiosClient.post('/Vouchers/send', { voucherId, userId })).data,
  apply: async (code: string, selectedItemIds: number[]): Promise<VoucherApplyResult> =>
    (await axiosClient.post('/Vouchers/apply', { code, selectedItemIds })).data,
  getCustomers: async (keyword?: string): Promise<CustomerLite[]> =>
    (await axiosClient.get('/Vouchers/customers', { params: keyword ? { keyword } : {} })).data,
};
