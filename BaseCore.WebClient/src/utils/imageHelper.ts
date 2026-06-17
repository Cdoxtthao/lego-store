const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:5210';

export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Nếu dữ liệu cũ trong DB còn lưu nhầm localhost:7175 thì đổi sang API hiện tại.
    return url.replace('http://localhost:5210', API_ROOT).replace('http://localhost:5210', API_ROOT);
  }

  return `${API_ROOT}${url.startsWith('/') ? url : '/' + url}`;
};

