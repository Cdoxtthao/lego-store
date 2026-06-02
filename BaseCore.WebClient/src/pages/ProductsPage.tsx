import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { ProductResponse, PagedResponse, ProductSearchRequest } from '../types';
import { getImageUrl } from '../utils/imageHelper';

// ========== SIDEBAR FILTER ==========
const FilterSidebar = ({
  filters,
  onChange,
  totalCount,
}: {
  filters: ProductSearchRequest;
  onChange: (f: ProductSearchRequest) => void;
  totalCount: number;
}) => {
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    age: true,
    pieces: true,
  });

  const toggle = (key: keyof typeof openSections) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const themes = [
    'City', 'Technic', 'Star Wars', 'Ninjago', 'Harry Potter',
    'One Piece', 'Pokemon', 'Monkie Kid', 'Disney', 'Speed Champions',
    'Jurassic World', 'Icons', 'Super Mario',
  ];

  const ageRanges = ['6+', '8+', '9+', '10+', '12+', '14+', '18+'];

  return (
    <aside className="w-64 flex-shrink-0">

      {/* Tổng số sản phẩm */}
      <p className="text-sm text-gray-500 mb-6">
        <span className="font-semibold text-gray-800">{totalCount}</span> sản phẩm
      </p>

      {/* Reset bộ lọc */}
      {(filters.theme || filters.minPrice || filters.maxPrice || filters.ageRange || filters.minPieces) && (
        <button
          onClick={() => onChange({ page: 1, pageSize: 12 })}
          className="w-full mb-4 text-sm text-flower-100 border border-flower-100 rounded-lg py-2 hover:bg-flower-50 transition">
          Xóa bộ lọc ✕
        </button>
      )}

      {/* Danh mục */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <button
          onClick={() => toggle('category')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-800 mb-3">
          Danh mục
          <svg className={`h-4 w-4 transition ${openSections.category ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openSections.category && (
          <div className="space-y-2">
            {themes.map(theme => (
              <label key={theme} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="theme"
                  checked={filters.theme === theme}
                  onChange={() => onChange({ ...filters, theme, page: 1 })}
                  className="accent-flower-100"
                />
                <span className={`text-sm group-hover:text-flower-100 transition
                  ${filters.theme === theme ? 'text-flower-100 font-medium' : 'text-gray-600'}`}>
                  {theme}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Giá */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <button
          onClick={() => toggle('price')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-800 mb-3">
          Giá (đ)
          <svg className={`h-4 w-4 transition ${openSections.price ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openSections.price && (
          <div className="space-y-3">
            {[
              { label: 'Dưới 500.000đ', min: undefined, max: 500000 },
              { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
              { label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
              { label: '2.000.000đ - 5.000.000đ', min: 2000000, max: 5000000 },
              { label: 'Trên 5.000.000đ', min: 5000000, max: undefined },
            ].map(range => (
              <label key={range.label} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="price"
                  checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                  onChange={() => onChange({ ...filters, minPrice: range.min, maxPrice: range.max, page: 1 })}
                  className="accent-flower-100"
                />
                <span className={`text-sm group-hover:text-flower-100 transition
                  ${filters.minPrice === range.min && filters.maxPrice === range.max
                    ? 'text-flower-100 font-medium' : 'text-gray-600'}`}>
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Độ tuổi */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <button
          onClick={() => toggle('age')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-800 mb-3">
          Độ tuổi
          <svg className={`h-4 w-4 transition ${openSections.age ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openSections.age && (
          <div className="flex flex-wrap gap-2">
            {ageRanges.map(age => (
              <button
                key={age}
                onClick={() => onChange({
                  ...filters,
                  ageRange: filters.ageRange === age ? undefined : age,
                  page: 1
                })}
                className={`px-3 py-1 text-sm rounded-full border transition
                  ${filters.ageRange === age
                    ? 'bg-flower-100 text-white border-flower-100'
                    : 'border-gray-300 text-gray-600 hover:border-flower-100 hover:text-flower-100'}`}>
                {age}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Số mảnh */}
      <div className="pb-4">
        <button
          onClick={() => toggle('pieces')}
          className="flex items-center justify-between w-full text-left font-semibold text-gray-800 mb-3">
          Số mảnh
          <svg className={`h-4 w-4 transition ${openSections.pieces ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openSections.pieces && (
          <div className="space-y-3">
            {[
              { label: 'Dưới 200 mảnh', min: undefined, max: 200 },
              { label: '200 - 500 mảnh', min: 200, max: 500 },
              { label: '500 - 1000 mảnh', min: 500, max: 1000 },
              { label: '1000 - 2000 mảnh', min: 1000, max: 2000 },
              { label: 'Trên 2000 mảnh', min: 2000, max: undefined },
            ].map(range => (
              <label key={range.label} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="pieces"
                  checked={filters.minPieces === range.min}
                  onChange={() => onChange({
                    ...filters,
                    minPieces: range.min,
                    page: 1
                  })}
                  className="accent-flower-100"
                />
                <span className={`text-sm group-hover:text-flower-100 transition
                  ${filters.minPieces === range.min
                    ? 'text-flower-100 font-medium' : 'text-gray-600'}`}>
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

// ========== PRODUCT CARD CHO TRANG SẢN PHẨM ==========
const ProductListCard = ({ product }: { product: ProductResponse }) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition group flex flex-col">

    {/* Ảnh */}
    <Link to={`/products/${product.id}`}
      className="relative bg-flower-50 p-4 overflow-hidden"
      style={{ aspectRatio: '1' }}>
      {product.discountPercent && (
        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
          -{product.discountPercent}%
        </span>
      )}
      {product.isFeatured && (
        <span className="absolute top-2 right-2 bg-flower-100 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
          ⭐ Nổi bật
        </span>
      )}
      <img
        src={getImageUrl(product.imageUrl)}
        alt={product.name}
        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    </Link>

    {/* Thông tin */}
    <div className="p-4 flex flex-col flex-1">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
        {product.categoryName} · {product.setNumber}
      </p>
      <Link to={`/products/${product.id}`}
        className="text-sm font-semibold text-gray-800 hover:text-flower-100 transition line-clamp-2 flex-1 mb-2">
        {product.name}
      </Link>

      {/* Rating */}
      {product.reviewCount > 0 && (
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className={`h-3 w-3 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
              fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>
      )}

      {/* Giá */}
      <div className="flex items-center gap-2 mb-3">
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
        <p className="text-xs text-gray-400 mb-3">{product.pieceCount} mảnh</p>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-auto">
        <button className="flex-1 bg-flower-100 text-white text-sm font-semibold py-2 rounded-lg hover:bg-flower-150 transition">
          Thêm vào giỏ
        </button>
        <button className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-flower-100 hover:border-flower-100 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

// ========== PHÂN TRANG ==========
const Pagination = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Trang đầu */}
      {pages[0] > 1 && (
        <>
          <button onClick={() => onChange(1)}
            className="w-9 h-9 border border-gray-300 rounded-lg text-sm hover:border-flower-100 hover:text-flower-100 transition">
            1
          </button>
          {pages[0] > 2 && <span className="text-gray-400">...</span>}
        </>
      )}

      {/* Các trang */}
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-9 h-9 border rounded-lg text-sm transition
            ${p === page
              ? 'bg-flower-100 text-white border-flower-100'
              : 'border-gray-300 hover:border-flower-100 hover:text-flower-100'}`}>
          {p}
        </button>
      ))}

      {/* Trang cuối */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400">...</span>}
          <button onClick={() => onChange(totalPages)}
            className="w-9 h-9 border border-gray-300 rounded-lg text-sm hover:border-flower-100 hover:text-flower-100 transition">
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

// ========== PRODUCTS PAGE ==========
const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PagedResponse<ProductResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProductSearchRequest>({
    page: 1,
    pageSize: 12,
  });

  useEffect(() => {
    setFilters({
      keyword: searchParams.get('keyword') || undefined,
      theme: searchParams.get('theme') || undefined,
      ageRange: searchParams.get('ageRange') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: 12,
    });
  }, [searchParams]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await productApi.getAll(filters);
        setResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filters]);

  const handleFilterChange = (newFilters: ProductSearchRequest) => {
    const params: Record<string, string> = {};
    if (newFilters.keyword) params.keyword = newFilters.keyword;
    if (newFilters.theme) params.theme = newFilters.theme;
    if (newFilters.ageRange) params.ageRange = newFilters.ageRange;
    if (newFilters.sortBy) params.sortBy = newFilters.sortBy;
    if (newFilters.isFeatured) params.isFeatured = 'true';
    if (newFilters.page && newFilters.page > 1) params.page = String(newFilters.page);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tiêu đề */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {filters.keyword
            ? `Kết quả tìm kiếm cho "${filters.keyword}"`
            : filters.theme
            ? `LEGO ${filters.theme}`
            : 'Tất cả sản phẩm'}
        </h1>

        <div className="flex gap-8 mt-6">

          {/* Sidebar */}
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            totalCount={result?.totalCount ?? 0}
          />

          {/* Main content */}
          <div className="flex-1">

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">

              {/* View mode */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Kiểu xem</span>
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'text-flower-100' : 'text-gray-400'}`}>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>
                  </svg>
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'text-flower-100' : 'text-gray-400'}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              </div>

              {/* Tổng số */}
              <span className="text-sm text-gray-500">
                {result?.totalCount ?? 0} sản phẩm
              </span>

              {/* Sắp xếp */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sắp xếp theo:</span>
                <select
                  value={filters.sortBy || ''}
                  onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value || undefined, page: 1 })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-flower-100">
                  <option value="">Mặc định</option>
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            {/* Loading skeleton */}
            {loading ? (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-2xl mb-3"/>
                    <div className="h-4 bg-gray-100 rounded mb-2"/>
                    <div className="h-4 bg-gray-100 rounded w-2/3"/>
                  </div>
                ))}
              </div>
            ) : result?.items.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <span className="text-6xl mb-4">🔍</span>
                <p className="text-lg font-medium mb-2">Không tìm thấy sản phẩm</p>
                <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button
                  onClick={() => handleFilterChange({ page: 1, pageSize: 12 })}
                  className="mt-4 px-6 py-2 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition">
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              // Grid sản phẩm
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {result?.items.map(p => (
                  <ProductListCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Phân trang */}
            {result && (
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                onChange={(p) => handleFilterChange({ ...filters, page: p })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;