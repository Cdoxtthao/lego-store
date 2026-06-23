import { useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
import { ProductResponse } from '../types';
import ProductCard from '../components/ProductCard';

// Top 20 sản phẩm bán chạy nhất (dựa theo số lượng đã bán qua đơn hàng — backend sortBy=bestseller)
const BestSellerPage = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.getAll({ sortBy: 'bestseller', page: 1, pageSize: 20 })
      .then(res => setProducts(res.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-flower-50 to-white py-12 px-6 text-center border-b border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔥 Top 20 Sản phẩm Bán chạy</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Những sản phẩm được mua nhiều nhất dựa trên dữ liệu đơn hàng thực tế của 3TL-Store.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-2xl mb-3" />
                <div className="h-3 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p, idx) => (
              <div key={p.id} className="relative">
                <span className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-flower-100 text-white text-sm font-bold flex items-center justify-center shadow">
                  {idx + 1}
                </span>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">Chưa có dữ liệu bán hàng.</div>
        )}
      </div>
    </div>
  );
};

export default BestSellerPage;
