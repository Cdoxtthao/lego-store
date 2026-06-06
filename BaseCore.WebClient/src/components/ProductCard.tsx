import { Link } from 'react-router-dom';
import { ProductResponse } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { cartApi } from '../api/cartApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import WishlistButton from './WishlistButton';

interface Props {
  product: ProductResponse;
}

const ProductCard = ({ product }: Props) => {
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // không chuyển trang khi click
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await cartApi.addToCart(product.id, 1);
      refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/products/${product.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition duration-300">

      {/* Ảnh */}
      <div className=" bg-flower-50 overflow-hidden relative" style={{ aspectRatio: '1' }}>
        {product.imageUrl ? (
          <img src={getImageUrl(product.imageUrl)} alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🧱</div>
        )}

        {/* Badge giảm giá */}
        {product.discountPercent && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discountPercent}%
          </span>
        )}

        {/* Badge nổi bật */}
        {product.isFeatured && (
          <span className="absolute top-2 right-2 bg-flower-100 text-white text-xs font-bold px-2 py-1 rounded-full">
            ⭐ Nổi bật
          </span>
        )}

        {/* Badge hết hàng trên ảnh */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-t-2xl">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Thông tin */}
      <div className="p-4 flex flex-col flex-1">
        {/* Danh mục */}
        {product.categoryName && (
          <p className="text-xs text-flower-100 font-medium mb-1">{product.categoryName}</p>
        )}

        {/* Tên sản phẩm */}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-flower-100 transition mb-2">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs text-gray-500">
              {product.averageRating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Giá */}
        <div className="flex items-center gap-2">
          <span className="text-flower-100 font-bold">
            {product.price.toLocaleString('vi-VN')}đ
          </span>
          {product.oldPrice && (
            <span className="text-gray-400 text-xs line-through">
              {product.oldPrice.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>

        {/* Số mảnh */}
        {product.pieceCount && (
          <p className="text-xs text-gray-400 mt-1">{product.pieceCount} mảnh</p>
        )}

        {/* Nút thêm giỏ */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={handleAddToCart || product.stockQuantity === 0}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition text-white
              ${product.stockQuantity === 0
                ? 'bg-gray-300 cursor-not-allowed'        // ← hết hàng
                : added
                ? 'bg-green-500'
                : 'bg-flower-100 hover:bg-flower-150'}
              disabled:opacity-50`}>
            {product.stockQuantity === 0
              ? 'Hết hàng'
              : loading ? '...'
              : added ? '✓ Đã thêm'
              : 'Thêm vào giỏ'}
          </button>
          <WishlistButton productId={product.id} />
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;