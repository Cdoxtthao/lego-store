import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthResponse } from '../types';

// 1. Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
  user: AuthResponse | null;   
  authLoading: boolean;
  isAuthenticated: boolean;       // true nếu đã đăng nhập
  isAdmin: boolean;               // true nếu role là Admin
  isSeller: boolean;              // true nếu role là Seller
  isSupplier: boolean;            // true nếu role là Supplier
  login: (data: AuthResponse) => void;   // hàm đăng nhập
  logout: () => void;             // hàm đăng xuất
}

// 2. Tạo Context với giá trị mặc định
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Provider — bọc toàn bộ app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expiry = payload.exp * 1000;
          if (Date.now() < expiry) {
            const parsed = JSON.parse(savedUser);
            setUser(parsed); // set tạm trước

            // ← Fetch avatarUrl mới nhất từ API
            try {
              const res = await fetch('http://localhost:5210/api/Users/me', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const profile = await res.json();
                const updated = { ...parsed, avatarUrl: profile.avatarUrl };
                setUser(updated);
                localStorage.setItem('user', JSON.stringify(updated));
              }
            } catch {
              // Giữ user cũ nếu fetch lỗi
            }

          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setAuthLoading(false);
    };
    initAuth();
  }, []);

  const login = (data: AuthResponse) => {
    // Lưu vào state và localStorage
    setUser(data);
    localStorage.setItem('token', data.token);   // lưu token
    localStorage.setItem('user', JSON.stringify(data)); // lưu user
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    authLoading,
    isAuthenticated: user !== null,   // user có tồn tại không?
    isAdmin: user?.role === 'Admin',
    isSeller: user?.role === 'Seller',
    isSupplier: user?.role === 'Supplier',
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Custom hook để dùng dễ hơn
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải dùng trong AuthProvider');
  }
  return context;
};
