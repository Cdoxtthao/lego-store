export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  expiresAt: string;
  avatarUrl?: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  importPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  categoryName?: string;
  categoryId?: number;
  theme?: string;       // tên chủ đề
  themeId?: number;    // id chủ đề
  ageRange?: string;
  gender?: string;
  highlights?: string;
  setNumber?: string;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  discountPercent?: number;
  images: ProductImageResponse[];
  soldCount: number;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
}

export interface ProductSearchRequest {
  keyword?: string;
  categoryId?: number;
  theme?: string;
  themeId?: number;    // lọc theo id chủ đề
  ageRange?: string;
  gender?: string;     // lọc theo giới tính (Nam | Nữ | Khác)
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  importPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  categoryId: number;
  theme?: string;    // legacy
  themeId?: number;  // FK to Themes
  ageRange?: string;
  gender?: string;
  highlights?: string;
  setNumber?: string;
  isFeatured?: boolean;
  discountPercent?: number;
  images?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  oldPrice?: number;
  importPrice?: number;
  stockQuantity?: number;
  imageUrl?: string;
  categoryId?: number;
  theme?: string;    // legacy
  themeId?: number;  // FK to Themes
  ageRange?: string;
  gender?: string;
  highlights?: string;
  setNumber?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  discountPercent?: number;
  images?: string[];
}

export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
}

export interface ReviewResponse {
  id: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  total: number;
  itemCount: number;
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  customerName: string;
  totalAmount: number;
  shippingAddress: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  note?: string;
  createdAt: string;
  items: OrderItemResponse[];
}