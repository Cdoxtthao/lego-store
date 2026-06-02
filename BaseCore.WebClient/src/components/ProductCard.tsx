import { Link } from 'react-router-dom';
import { ProductResponse } from '../types';
import { getImageUrl } from '../utils/imageHelper';

interface Props {
  product: ProductResponse;
}

const ProductCard = ({ product }: Props) => {
  return (
    <Link to={`/products/${product.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition duration-300">

      {/* Ảnh */}
      <div className="aspect-square bg-flower-50 overflow-hidden relative">
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
      </div>

      {/* Thông tin */}
      <div className="p-4">
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
      </div>
    </Link>
  );
};

export default ProductCard;