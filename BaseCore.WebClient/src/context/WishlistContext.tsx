import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { wishlistApi } from '../api/wishlistApi';

interface WishlistContextType {
  wishlistCount: number;
  refreshWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistCount: 0,
  refreshWishlist: () => {},
});

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlistCount, setWishlistCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const refreshWishlist = async () => {
    if (!isAuthenticated) { setWishlistCount(0); return; }
    try {
      const res = await wishlistApi.getCount();
      setWishlistCount(res.count);
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  return (
    <WishlistContext.Provider value={{ wishlistCount, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
