import axiosClient from './axiosClient';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authApi = {

  // POST /api/Auth/login
  // Nhận LoginRequest, trả AuthResponse
  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/Auth/login', request);
    return response.data;
  },

  // POST /api/Auth/register  
  // Nhận RegisterRequest, trả message string
  register: async (request: RegisterRequest): Promise<{message: string}> => {
    const response = await axiosClient.post<{message: string}>('/Auth/register', request);
    return response.data;
  },

  // GET /api/Auth/me
  // Không nhận tham số, trả AuthResponse
  // Token tự động được thêm bởi axiosClient interceptor
  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await axiosClient.get<AuthResponse>('/Auth/me');
    return response.data;
  },
};