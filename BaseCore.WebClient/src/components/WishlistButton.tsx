import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { wishlistApi } from '../api/wishlistApi';
import { useNavigate } from 'react-router-dom';

const WishlistButton = ({
  productId,
  size = 'sm',
}: {
  productId: number;
  size?: 'sm' | 'md';
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { refreshWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    wishlistApi.check(productId).then(res => {
      setIsWishlisted(res.isWishlisted);
    }).catch(() => {});
  }, [productId, isAuthenticated]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      if (isWishlisted) {
        await wishlistApi.remove(productId);
        setIsWishlisted(false);
      } else {
        await wishlistApi.add(productId);
        setIsWishlisted(true);
      }
      refreshWishlist();
    } finally {
      setLoading(false);
    }
  };

  const sizeClass = size === 'md'
    ? 'w-10 h-10'
    : 'w-8 h-8';

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-9 h-9 border rounded-xl flex items-center justify-center transition
        ${isWishlisted
          ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
          : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50'}`}>
      {loading ? (
        <div className={`border-2 border-t-transparent rounded-full animate-spin
          ${isWishlisted ? 'border-red-400' : 'border-gray-300'}
          ${size === 'md' ? 'w-4 h-4' : 'w-3 h-3'}`} />
      ) : (
        <svg
          className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'}
          fill={isWishlisted ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
};

export default WishlistButton;
