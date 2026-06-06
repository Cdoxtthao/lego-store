import axios from 'axios';

const BASE_URL = 'https://localhost:7175/api';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Token từ localStorage:', token);
  console.log('Token length:', token?.length);
  console.log('Token parts:', token?.split('.').length);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header:', config.headers.Authorization?.toString().substring(0, 80));
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/admin') || currentPath.includes('/profile')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // Các trang khác — throw error để component tự xử lý
    }
    return Promise.reject(error);
  }
);

export default axiosClient;