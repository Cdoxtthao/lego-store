const BASE_URL = 'https://localhost:7175';

export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
};