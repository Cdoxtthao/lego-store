import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistApi } from '../api/wishlistApi';
import { cartApi } from '../api/cartApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageHelper';

const WishlistPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addingCartId, setAddingCartId] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const { refreshWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchWishlist();
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await wishlistApi.getAll();
      setItems(res);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    try {
      await wishlistApi.remove(productId);
      setItems(prev => prev.filter(i => i.productId !== productId));
      refreshWishlist();
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (productId: number) => {
    setAddingCartId(productId);
    try {
      await cartApi.addToCart(productId, 1);
      refreshCart();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setAddingCartId(null);
    }
  };

  const handleMoveAllToCart = async () => {
    try {
      let addedAny = false;
      for (const item of items) {
        if (item.stockQuantity > 0) {
          await cartApi.addToCart(item.productId, 1);
          addedAny = true;
        }
      }
      if (addedAny) refreshCart();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi chuyển sản phẩm vào giỏ');
      refreshCart();
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-100 rounded-2xl mb-3" />
            <div className="h-4 bg-gray-100 rounded mb-2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              ❤️ Danh sách yêu thích
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {items.length} sản phẩm
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleMoveAllToCart}
                className="px-5 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Thêm tất cả vào giỏ
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-8xl mb-6">💔</span>
            <p className="text-xl font-medium text-gray-600 mb-2">
              Danh sách yêu thích trống
            </p>
            <p className="text-sm mb-6">
              Hãy thêm sản phẩm yêu thích để xem lại sau!
            </p>
            <Link to="/products"
              className="px-8 py-3 bg-flower-100 text-white rounded-full font-medium hover:bg-flower-150 transition">
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {items.map(item => (
              <div key={item.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition group flex flex-col">

                {/* Ảnh */}
                <Link to={`/products/${item.productId}`}
                  className="relative bg-flower-50 overflow-hidden"
                  style={{ aspectRatio: '1' }}>

                  {/* Badge giảm giá */}
                  {(item.discountPercent ?? 0) > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
                      -{item.discountPercent}%
                    </span>
                  )}

                  {/* Badge hết hàng */}
                  {item.stockQuantity === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                      <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
                        Hết hàng
                      </span>
                    </div>
                  )}

                  <img
                    src={getImageUrl(item.productImage)}
                    alt={item.productName}
                    className="absolute inset-0 w-full h-full object-contain p-1 group-hover:scale-105 transition duration-300"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />

                  {/* Nút xóa khỏi wishlist */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(item.productId);
                    }}
                    disabled={removingId === item.productId}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-500 hover:text-white transition z-20 opacity-0 group-hover:opacity-100">
                    {removingId === item.productId ? (
                      <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </Link>

                {/* Thông tin */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-flower-100 font-medium mb-1">
                    {item.categoryName || item.theme}
                  </p>

                  <Link to={`/products/${item.productId}`}
                    className="text-sm font-semibold text-gray-800 hover:text-flower-100 transition line-clamp-2 flex-1 mb-2">
                    {item.productName}
                  </Link>

                  {/* Rating */}
                  {item.reviewCount > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-400">
                        {Number(item.averageRating).toFixed(1)} ({item.reviewCount})
                      </span>
                    </div>
                  )}

                  {/* Giá */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-flower-100 font-bold">
                      {Number(item.price).toLocaleString('vi-VN')}đ
                    </span>
                    {item.oldPrice && (
                      <span className="text-gray-400 text-xs line-through">
                        {Number(item.oldPrice).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>

                  {/* Nút thêm vào giỏ */}
                  <button
                    onClick={() => handleAddToCart(item.productId)}
                    disabled={item.stockQuantity === 0 || addingCartId === item.productId}
                    className={`w-full py-2 rounded-xl text-sm font-semibold transition
                      ${item.stockQuantity === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : addingCartId === item.productId
                        ? 'bg-green-500 text-white'
                        : 'bg-flower-100 text-white hover:bg-flower-150'}`}>
                    {item.stockQuantity === 0
                      ? 'Hết hàng'
                      : addingCartId === item.productId
                      ? '✓ Đã thêm'
                      : 'Thêm vào giỏ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;