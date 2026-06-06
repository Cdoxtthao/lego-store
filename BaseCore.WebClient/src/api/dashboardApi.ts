import axiosClient from './axiosClient';

export const dashboardApi = {
  getStats: async () => {
    const res = await axiosClient.get('/Dashboard/stats');
    return res.data;
  },
  getRevenueChart: async () => {
    const res = await axiosClient.get('/Dashboard/revenue-chart');
    return res.data;
  },
  getOrderStatusChart: async () => {
    const res = await axiosClient.get('/Dashboard/order-status-chart');
    return res.data;
  },
  getTopProducts: async () => {
    const res = await axiosClient.get('/Dashboard/top-products');
    return res.data;
  },
  getRecentOrders: async () => {
    const res = await axiosClient.get('/Dashboard/recent-orders');
    return res.data;
  },
  getNotifications: async () => {
  const res = await axiosClient.get('/Dashboard/notifications');
  return res.data;
  },
};