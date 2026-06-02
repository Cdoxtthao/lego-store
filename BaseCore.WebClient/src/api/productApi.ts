import axiosClient from './axiosClient';
import { ProductResponse, PagedResponse, ProductSearchRequest, CreateProductRequest, UpdateProductRequest } from '../types';

export const productApi = {

  // GET /api/Products?keyword=...&page=1&pageSize=12
  // Nhận ProductSearchRequest (query params), trả PagedResponse<ProductResponse>
  getAll: async (params: ProductSearchRequest): Promise<PagedResponse<ProductResponse>> => {
    const response = await axiosClient.get<PagedResponse<ProductResponse>>('/Products', {
      params: params  // truyền params vào query string
    });
    return response.data;
  },

  // GET /api/Products/featured?count=8
  getFeatured: async (count: number = 8): Promise<ProductResponse[]> => {
    const response = await axiosClient.get<ProductResponse[]>('/Products/featured', {
      params: { count }
    });
    return response.data;
  },

  // GET /api/Products/{id}
  getById: async (id: number): Promise<ProductResponse> => {
    const response = await axiosClient.get<ProductResponse>(`/Products/${id}`);
    return response.data;
  },

  // POST /api/Products — cần token Admin/Seller
  create: async (request: CreateProductRequest): Promise<ProductResponse> => {
    const response = await axiosClient.post<ProductResponse>('/Products', request);
    return response.data;
  },

  // PUT /api/Products/{id} — cần token Admin/Seller  
  update: async (id: number, request: UpdateProductRequest): Promise<ProductResponse> => {
    const response = await axiosClient.put<ProductResponse>(`/Products/${id}`, request);
    return response.data;
  },

  // DELETE /api/Products/{id} — cần token Admin
  delete: async (id: number): Promise<{message: string}> => {
    const response = await axiosClient.delete<{message: string}>(`/Products/${id}`);
    return response.data;
  },
};