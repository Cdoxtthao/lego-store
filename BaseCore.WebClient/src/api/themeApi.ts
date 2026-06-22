import axiosClient from './axiosClient';

export interface ThemeCategoryRef {
  id: number;
  name: string;
}

export interface ThemeResponse {
  id: number;
  name: string;
  description?: string;
  // Một chủ đề có thể thuộc nhiều danh mục (quan hệ nhiều-nhiều)
  categories: ThemeCategoryRef[];
  isActive: boolean;
  createdAt: string;
}

export const themeApi = {
  // Không truyền categoryId -> trả về toàn bộ chủ đề (dùng để gợi ý trùng tên khi tạo mới)
  getAll: async (categoryId?: number): Promise<ThemeResponse[]> => {
    const res = await axiosClient.get('/Themes', { params: categoryId ? { categoryId } : {} });
    return res.data;
  },
  // Backend tự gộp theo tên: nếu đã có chủ đề cùng tên thì chỉ tạo liên kết với danh mục này,
  // không tạo chủ đề mới
  create: async (data: { name: string; categoryId: number; description?: string }) => {
    const res = await axiosClient.post('/Themes', data);
    return res.data;
  },
  // Đổi tên/mô tả chủ đề — áp dụng cho mọi danh mục đang dùng chủ đề này
  update: async (id: number, data: { name: string; description?: string }) => {
    const res = await axiosClient.put(`/Themes/${id}`, data);
    return res.data;
  },
  // Xóa chủ đề khỏi toàn hệ thống
  delete: async (id: number) => {
    const res = await axiosClient.delete(`/Themes/${id}`);
    return res.data;
  },
  // Gỡ chủ đề khỏi MỘT danh mục (chủ đề vẫn còn ở các danh mục khác)
  unlinkFromCategory: async (themeId: number, categoryId: number) => {
    const res = await axiosClient.delete(`/Themes/${themeId}/categories/${categoryId}`);
    return res.data;
  },
};
