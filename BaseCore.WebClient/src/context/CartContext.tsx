import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartApi } from '../api/cartApi';
import axiosClient from '../api/axiosClient';

interface CartContextType {
  cartCount: number;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  refreshCart: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    try {
      const cart = await cartApi.getCart();
      setCartCount(cart?.items?.length || 0);
    } catch { setCartCount(0); }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);