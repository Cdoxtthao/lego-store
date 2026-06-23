import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { ProductResponse, ProductSearchRequest } from '../../types';
import { getImageUrl } from '../../utils/imageHelper';
import axiosClient from '../../api/axiosClient';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../../context/AuthContext';
import { categoryApi, CategoryResponse } from '../../api/categoryApi';
import { themeApi, ThemeResponse } from '../../api/themeApi';

import { useSearchParams } from 'react-router-dom';

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const maxButtons = 5;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let end = start + maxButtons - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxButtons + 1);
  }
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
};

const AdminProducts = () => {
  const { isSupplier, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || searchParams.get('search') || '';

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ProductSearchRequest>({
    page: 1,
    pageSize: isSupplier ? 12 : 10,
    keyword: initialKeyword || undefined
  });
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState(initialKeyword);
  // Filter dropdowns
  const [filterCategories, setFilterCategories] = useState<CategoryResponse[]>([]);
  const [filterThemes, setFilterThemes] = useState<ThemeResponse[]>([]);
  const [filterCatId, setFilterCatId] = useState<number | ''>('');
  const [filterThemeId, setFilterThemeId] = useState<number | ''>('');

  useEffect(() => {
    const kw = searchParams.get('keyword') || searchParams.get('search') || '';
    setSearch(kw);
    setFilters(f => ({ ...f, keyword: kw || undefined, page: 1 }));
  }, [searchParams]);

  useEffect(() => {
    categoryApi.getAll().then(setFilterCategories).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [filters]);

  useEffect(() => {
    if (search === '') {
        setFilters(f => ({ ...f, keyword: undefined, page: 1 }));
    }
  }, [search]);

  useEffect(() => {
    setFilters(f => ({ ...f, pageSize: isSupplier ? 12 : 10 }));
  }, [isSupplier]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll(filters);
      setProducts(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching products:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setFilters({ ...filters, keyword: search, page: 1 });
  };

  const handleCategoryFilter = (catId: number | '') => {
    setFilterCatId(catId);
    setFilterThemeId('');
    setFilterThemes([]);
    setFilters(f => ({ ...f, categoryId: catId || undefined, themeId: undefined, page: 1 }));
    if (catId) {
      themeApi.getAll(catId as number).then(setFilterThemes).catch(() => {});
    }
  };

  const handleThemeFilter = (themeId: number | '') => {
    setFilterThemeId(themeId);
    setFilters(f => ({ ...f, themeId: themeId || undefined, page: 1 }));
  };

  const handleDelete = async (id: number) => {
    await productApi.delete(id);
    setDeleteId(null);
    fetchProducts();
  };

  const totalPages = Math.ceil(totalCount / (filters.pageSize || (isSupplier ? 12 : 10)));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {isSupplier ? 'Danh sách sản phẩm' : 'Quản lý sản phẩm'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isSupplier
              ? `Tổng ${totalCount} sản phẩm · Xem để tạo đề nghị cung ứng`
              : `Tổng ${totalCount} sản phẩm`}
          </p>
        </div>
        {isSupplier ? (
          <button
            onClick={() => navigate('/admin/proposals')}
            className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tạo đề nghị cung ứng
          </button>
        ) : isSeller ? (
          <button
            onClick={() => { setEditProduct(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm sản phẩm
          </button>
        ) : null}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value === '') {
                    setFilters(f => ({ ...f, keyword: undefined, page: 1 }))
                }
              }}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
            />
          </div>
          {/* Danh mục filter */}
          <select
            value={filterCatId}
            onChange={(e) => handleCategoryFilter(e.target.value ? Number(e.target.value) : '')}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100">
            <option value="">Tất cả danh mục</option>
            {filterCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {/* Chủ đề filter */}
          <select
            value={filterThemeId}
            onChange={(e) => handleThemeFilter(e.target.value ? Number(e.target.value) : '')}
            disabled={!filterCatId}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 disabled:opacity-50 disabled:cursor-not-allowed">
            <option value="">{filterCatId ? 'Tất cả chủ đề' : 'Chọn danh mục trước'}</option>
            {filterThemes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {/* Sắp xếp */}
          <select
            value={filters.sortBy || ''}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value || undefined, page: 1 })}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100">
            <option value="">Mặc định</option>
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng</option>
            <option value="price_desc">Giá giảm</option>
          </select>
          <button type="submit"
            className="px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm hover:bg-flower-150 transition">
            Tìm
          </button>
        </form>
      </div>
      {/* Table / Grid */}
      {isSupplier ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-60 animate-pulse flex flex-col justify-between">
                  <div className="bg-gray-100 h-32 rounded-xl" />
                  <div className="space-y-2 mt-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
                <span className="text-5xl block mb-2">📦</span>
                Không có sản phẩm nào
              </div>
            ) : (
              products.map(product => (
                <div
                  key={product.id}
                  onClick={() => { setEditProduct(product); setShowModal(true); }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition cursor-pointer flex flex-col group"
                >
                  {/* Image */}
                  <div className="bg-flower-50 rounded-xl h-36 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  {/* Info */}
                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-flower-100 transition" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">#{product.setNumber || '—'}</p>
                    </div>
                    {/* Category & Theme badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {product.categoryName || '—'}
                      </span>
                      <span className="text-[10px] bg-flower-50 text-flower-100 px-2 py-0.5 rounded-full font-medium">
                        {product.theme || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Phân trang cho Supplier */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-100 mb-6">
              <p className="text-xs text-gray-400">
                Trang {filters.page} / {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                  disabled={(filters.page || 1) <= 1}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
                  ‹
                </button>
                {getPageNumbers(filters.page || 1, totalPages).map(page => (
                  <button key={page}
                    onClick={() => setFilters(f => ({ ...f, page }))}
                    className={`w-8 h-8 border rounded-lg text-xs transition
                      ${page === (filters.page || 1)
                        ? 'bg-flower-100 text-white border-flower-100'
                        : 'border-gray-200 text-gray-600 hover:border-flower-100'}`}>
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                  disabled={(filters.page || 1) >= totalPages}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Danh mục</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chủ đề</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Giá</th>
                {!isSupplier && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tồn kho</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nổi bật</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={isSupplier ? 6 : 7} className="px-4 py-3">
                      <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={isSupplier ? 6 : 7} className="text-center py-12 text-gray-400">
                    <span className="text-4xl block mb-2">📦</span>
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr
                      key={product.id}
                      onClick={() => { if (isSeller) { setEditProduct(product); setShowModal(true); } }}
                      className={`hover:bg-gray-50 transition ${isSeller ? 'cursor-pointer' : ''}`}>
                    {/* Sản phẩm */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0 bg-flower-50 rounded-xl overflow-hidden">
                          <img
                            src={getImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400">#{product.setNumber}</p>
                        </div>
                      </div>
                    </td>

                    {/* Danh mục */}
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                        {product.categoryName || '—'}
                      </span>
                    </td>

                    {/* Chủ đề */}
                    <td className="px-4 py-3">
                      <span className="text-xs bg-flower-50 text-flower-100 px-2 py-1 rounded-full font-medium">
                        {product.theme || '—'}
                      </span>
                    </td>

                    {/* Giá */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-flower-100">
                        {product.price.toLocaleString('vi-VN')}đ
                      </p>
                      {product.oldPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {product.oldPrice.toLocaleString('vi-VN')}đ
                        </p>
                      )}
                    </td>

                    {/* Tồn kho */}
                    {!isSupplier && (
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full
                          ${product.stockQuantity > 10
                            ? 'bg-green-50 text-green-600'
                            : product.stockQuantity > 0
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-red-50 text-red-600'}`}>
                          {product.stockQuantity > 0 ? `${product.stockQuantity} sp` : 'Hết hàng'}
                        </span>
                      </td>
                    )}

                    {/* Nổi bật */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                        ${product.isFeatured
                          ? 'bg-flower-50 text-flower-100'
                          : 'bg-gray-100 text-gray-400'}`}>
                        {product.isFeatured ? '⭐ Nổi bật' : 'Thường'}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Seller: chỉ sửa */}
                        {isSeller && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditProduct(product); setShowModal(true); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        )}
                        {/* Admin: chỉ xoá */}
                        {isAdmin && (
                        <button
                          onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(product.id)
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Trang {filters.page} / {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                  disabled={(filters.page || 1) <= 1}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
                  ‹
                </button>
                {getPageNumbers(filters.page || 1, totalPages).map(page => (
                  <button key={page}
                    onClick={() => setFilters(f => ({ ...f, page }))}
                    className={`w-8 h-8 border rounded-lg text-xs transition
                      ${page === (filters.page || 1)
                        ? 'bg-flower-100 text-white border-flower-100'
                        : 'border-gray-200 text-gray-600 hover:border-flower-100'}`}>
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                  disabled={(filters.page || 1) >= totalPages}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Thêm/Sửa sản phẩm */}
      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchProducts(); }}
        />
      )}

      {/* Modal Xác nhận xóa */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <span className="text-4xl block mb-3">🗑️</span>
              <h3 className="font-bold text-gray-800 text-lg">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bạn có chắc muốn xóa sản phẩm này không?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== FIELD HELPER (must be outside ProductModal to avoid focus loss) ==========
const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100";

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// ========== PRODUCT MODAL ==========
const ProductModal = ({
  product,
  onClose,
  onSaved,
}: {
  product: ProductResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { isSupplier, isSeller } = useAuth();
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price != null ? String(product.price) : '',
    oldPrice: product?.oldPrice != null ? String(product.oldPrice) : '',
    stockQuantity: product?.stockQuantity != null ? String(product.stockQuantity) : '',
    imageUrl: product?.imageUrl || '',
    categoryId: product?.categoryId || 0,
    themeId: product?.themeId || 0,
    ageRange: product?.ageRange || '',
    gender: product?.gender || 'Khác',
    highlights: product?.highlights || '',
    setNumber: product?.setNumber || '',
    isFeatured: product?.isFeatured || false,
  });
  const [previewImage, setPreviewImage] = useState<string>(
  product?.imageUrl ? `https://localhost:7175${product.imageUrl}` : ''
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [extraImages, setExtraImages] = useState<string[]>(
    product?.images
      ?.map(img => img.imageUrl)
      .filter(url => url !== product?.imageUrl) || []
  );
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [dbCategories, setDbCategories] = useState<CategoryResponse[]>([]);
  const [dbThemes, setDbThemes] = useState<ThemeResponse[]>([]);

  // Ref để luôn đọc giá trị form state mới nhất trong các async upload handler (tránh stale closure)
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    categoryApi.getAll().then(setDbCategories).catch(() => {});
  }, []);

  // Load themes when category changes
  useEffect(() => {
    if (form.categoryId) {
      themeApi.getAll(form.categoryId).then(setDbThemes).catch(() => {});
    } else {
      setDbThemes([]);
    }
  }, [form.categoryId]);

  const compressAndUpload = async (file: File): Promise<string> => {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });

    const formData = new FormData();
    formData.append('file', compressed, file.name);

    const res = await axiosClient.post('/Image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  const handleUploadExtraImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingExtra(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const url = await compressAndUpload(file);
        uploaded.push(url);
      }

      // Đọc imageUrl mới nhất từ ref để tránh stale closure
      const currentImageUrl = formRef.current.imageUrl;

      // Kiểm tra xem đã có ảnh chính chưa
      if (!currentImageUrl && uploaded.length > 0) {
        // Chưa có ảnh chính → ảnh đầu tiên thành ảnh chính
        const [first, ...rest] = uploaded;
        setPreviewImage(`https://localhost:7175${first}`);
        setForm(prev => ({ ...prev, imageUrl: first }));
        setExtraImages(prev => [...prev, ...rest]);
      } else {
        // Đã có ảnh chính → thêm tất cả vào extra
        setExtraImages(prev => [...prev, ...uploaded]);
      }
    } catch {
      setError('Upload ảnh thất bại');
    } finally {
      setUploadingExtra(false);
      e.target.value = '';
    }
  };

  const handleRemoveExtraImage = (index: number) => {
    setExtraImages(prev => prev.filter((_, i) => i !== index));
  };

  // Swap: ảnh extra được chọn → ảnh chính; ảnh chính cũ → về extra
  const handleSetMainImage = (url: string) => {
    setForm(prev => {
      const oldMain = prev.imageUrl;
      // Đưa ảnh chính cũ vào extra (nếu có), xóa ảnh được chọn khỏi extra
      setExtraImages(prevExtra => {
        const withoutSelected = prevExtra.filter(img => img !== url);
        return oldMain ? [oldMain, ...withoutSelected] : withoutSelected;
      });
      return { ...prev, imageUrl: url };
    });
    setPreviewImage(url.startsWith('http') ? url : `https://localhost:7175${url}`);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    const allImages = form.imageUrl
      ? [form.imageUrl, ...extraImages.filter(img => img !== form.imageUrl)]
      : extraImages;

    setSaving(true);
    try {
      const selectedTheme = dbThemes.find(t => t.id === form.themeId);
      if (product) {
        await productApi.update(product.id, {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          oldPrice: form.oldPrice !== '' ? Number(form.oldPrice) : undefined,
          stockQuantity: Number(form.stockQuantity),
          imageUrl: form.imageUrl,
          categoryId: form.categoryId || undefined,
          themeId: form.themeId || undefined,
          theme: selectedTheme?.name,
          ageRange: form.ageRange,
          gender: form.gender,
          highlights: form.description,
          setNumber: form.setNumber,
          isFeatured: form.isFeatured,
          images: allImages,
        });
      } else {
        await productApi.create({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          oldPrice: form.oldPrice !== '' ? Number(form.oldPrice) : undefined,
          stockQuantity: Number(form.stockQuantity),
          imageUrl: form.imageUrl,
          categoryId: form.categoryId,
          themeId: form.themeId || undefined,
          theme: selectedTheme?.name,
          ageRange: form.ageRange,
          gender: form.gender,
          highlights: form.description,
          setNumber: form.setNumber,
          isFeatured: form.isFeatured,
          images: allImages,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview ngay
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await compressAndUpload(file);
      // Đọc imageUrl hiện tại và chuyển thành ảnh phụ nếu có
      setForm(prev => {
        const oldMain = prev.imageUrl;
        if (oldMain && oldMain !== url) {
          setExtraImages(prevExtra => {
            if (!prevExtra.includes(oldMain)) {
              return [oldMain, ...prevExtra];
            }
            return prevExtra;
          });
        }
        return { ...prev, imageUrl: url };
      });
      setPreviewImage(`https://localhost:7175${url}`);
    } catch {
      setError('Upload ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input để có thể chọn lại cùng file
    }
  };

  if (isSupplier) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-bold text-gray-800 text-lg">
              🔍 Chi tiết sản phẩm
            </h3>
            <button onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Details Content */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image & Extra Images */}
              <div className="w-full md:w-1/2 space-y-3">
                <div className="bg-flower-50 rounded-2xl h-60 overflow-hidden flex items-center justify-center border border-gray-100">
                  {previewImage ? (
                    <img src={previewImage} alt={form.name} className="w-full h-full object-contain p-4" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                {extraImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {/* Main image thumbnail */}
                    {form.imageUrl && (
                      <div 
                        onClick={() => setPreviewImage(form.imageUrl.startsWith('http') ? form.imageUrl : `https://localhost:7175${form.imageUrl}`)}
                        className={`w-12 h-12 rounded-lg border-2 overflow-hidden bg-flower-50 cursor-pointer transition ${previewImage.endsWith(form.imageUrl) ? 'border-flower-100' : 'border-gray-200'}`}
                      >
                        <img src={form.imageUrl.startsWith('http') ? form.imageUrl : `https://localhost:7175${form.imageUrl}`} alt="Main thumbnail" className="w-full h-full object-contain p-1" />
                      </div>
                    )}
                    {/* Extra image thumbnails */}
                    {extraImages.map((img, i) => {
                      const fullUrl = img.startsWith('http') ? img : `https://localhost:7175${img}`;
                      return (
                        <div 
                          key={i}
                          onClick={() => setPreviewImage(fullUrl)}
                          className={`w-12 h-12 rounded-lg border-2 overflow-hidden bg-flower-50 cursor-pointer transition ${previewImage === fullUrl ? 'border-flower-100' : 'border-gray-200'}`}
                        >
                          <img src={fullUrl} alt={`Thumbnail ${i}`} className="w-full h-full object-contain p-1" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Info Column */}
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{form.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">Mã set: <span className="font-mono font-semibold text-gray-600">#{form.setNumber || '—'}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Danh mục</p>
                    <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-medium">
                      {dbCategories.find(c => c.id === form.categoryId)?.name || '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chủ đề</p>
                    <span className="inline-block mt-1 text-xs bg-flower-50 text-flower-100 px-2.5 py-0.5 rounded-full font-medium">
                      {dbThemes.find(t => t.id === form.themeId)?.name || '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Độ tuổi phù hợp</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{form.ageRange || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Giới tính phù hợp</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{form.gender}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description / Highlights */}
            {form.description && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mô tả sản phẩm</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{form.description}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex justify-end">
            <button onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">
            {product ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
          </h3>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Tên sản phẩm" required>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass} placeholder="Tên sản phẩm..." />
              </Field>
            </div>

            <Field label="Giá bán" required>
              <input type="text" inputMode="numeric" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass} placeholder="0" />
            </Field>

            <Field label="Giá gốc (nếu có)">
              <input type="text" inputMode="numeric" value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                className={inputClass} placeholder="0" />
            </Field>

            {!isSupplier && (
              <Field label="Tồn kho" required>
                <input type="text" inputMode="numeric" value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  disabled={isSupplier || isSeller}
                  className={`${inputClass} disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-75`} placeholder="0" />
              </Field>
            )}

            <Field label="Mã set">
              <input type="text" value={form.setNumber}
                onChange={(e) => setForm({ ...form, setNumber: e.target.value })}
                className={inputClass} placeholder="VD: 75382" />
            </Field>

            <Field label="Danh mục" required>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  setForm({ ...form, categoryId: Number(e.target.value), themeId: 0 });
                }}
                className={inputClass}>
                <option value={0}>-- Chọn danh mục --</option>
                {dbCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Chủ đề">
              <select
                value={form.themeId}
                onChange={(e) => setForm({ ...form, themeId: Number(e.target.value) })}
                disabled={!form.categoryId}
                className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
                <option value={0}>{form.categoryId ? '-- Chọn chủ đề --' : 'Chọn danh mục trước'}</option>
                {dbThemes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Độ tuổi">
              <select value={form.ageRange}
                onChange={(e) => setForm({ ...form, ageRange: e.target.value })}
                className={inputClass}>
                <option value="">Chọn độ tuổi</option>
                {['6+', '8+', '9+', '10+', '12+', '14+', '18+'].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>

            <Field label="Giới tính">
              <select value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={inputClass}>
                <option value="Khác">Khác (Nam/Nữ đều phù hợp)</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </Field>

            <div className="col-span-2">
              <Field label="Mô tả">
                <textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className={inputClass}
                  placeholder="Mô tả sản phẩm..." />
              </Field>
            </div>

      {/* Upload ảnh */}
        <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-2">
            Ảnh sản phẩm
        </label>

        <div className="flex gap-4">

            {/* Preview ảnh */}
            <div className="w-32 h-32 flex-shrink-0 bg-flower-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
            {previewImage ? (
                <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-contain p-2"
                onError={() => setPreviewImage('')}
                />
            ) : (
                <div className="text-center text-gray-400">
                <svg className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Chưa có ảnh</p>
                </div>
            )}
            </div>

            {/* Upload + URL */}
            <div className="flex-1 space-y-3">

            {/* Nút upload */}
            <div>
                <label
                htmlFor="imageUpload"
                className={`flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition text-sm
                    ${uploading
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-flower-100 text-flower-100 hover:bg-flower-50'}`}>
                {uploading ? (
                    <>
                    <div className="w-4 h-4 border-2 border-flower-100 border-t-transparent rounded-full animate-spin" />
                    Đang upload...
                    </>
                ) : (
                    <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Chọn ảnh từ máy
                    </>
                )}
                </label>
                <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                disabled={uploading}
                className="hidden"
                />
                <p className="text-xs text-gray-400 mt-1 text-center">PNG, JPG, WebP — tối đa 5MB</p>
            </div>

            {/* Hoặc nhập URL */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">hoặc nhập URL</span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => {
                setForm({ ...form, imageUrl: e.target.value });
                // Preview từ URL
                if (e.target.value) {
                    setPreviewImage(
                    e.target.value.startsWith('http')
                        ? e.target.value
                        : `https://localhost:7175${e.target.value}`
                    );
                } else {
                    setPreviewImage('');
                }
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                placeholder="/images/products/ten-san-pham.png"
            />

            {/* Xóa ảnh */}
            {previewImage && (
                <button
                type="button"
                onClick={() => { setPreviewImage(''); setForm({ ...form, imageUrl: '' }); }}
                className="text-xs text-red-500 hover:underline">
                ✕ Xóa ảnh
                </button>
            )}
            </div>
        </div>
        </div>

        {/* ========== NHIỀU ẢNH ========== */}
<div className="col-span-2">
  <label className="block text-xs font-medium text-gray-600 mb-2">
    Ảnh bổ sung
    <span className="text-gray-400 font-normal ml-1">
      (click vào ảnh để đặt làm ảnh chính)
    </span>
  </label>

  {/* Grid ảnh đã upload */}
  <div className="flex flex-wrap gap-3 mb-3">

    {/* Ảnh chính — luôn hiện đầu tiên */}
    {form.imageUrl && (
      <div className="relative group">
        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-flower-100 bg-flower-50">
          <img
            src={previewImage}
            alt="Ảnh chính"
            className="w-full h-full object-contain p-1"
          />
        </div>
        <span className="absolute -top-1.5 -left-1.5 bg-flower-100 text-white text-xs px-1.5 py-0.5 rounded-full">
          Chính
        </span>
      </div>
    )}

    {/* Ảnh bổ sung */}
    {extraImages.map((url, index) => (
      <div key={index} className="relative group">
        <div
          className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 bg-flower-50 cursor-pointer hover:border-flower-100 transition"
          onClick={() => handleSetMainImage(url)}
          title="Click để đặt làm ảnh chính">
          <img
            src={url.startsWith('http') ? url : `https://localhost:7175${url}`}
            alt={`Ảnh ${index + 1}`}
            className="w-full h-full object-contain p-1"
            onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
          />
        </div>

        {/* Nút xóa */}
        <button
          type="button"
          onClick={() => handleRemoveExtraImage(index)}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs">
          ✕
        </button>

        {/* Nút đặt làm ảnh chính */}
        <button
          type="button"
          onClick={() => handleSetMainImage(url)}
          className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 rounded-b-xl opacity-0 group-hover:opacity-100 transition text-center">
          Đặt chính
        </button>
      </div>
    ))}

    {/* Nút thêm ảnh */}
    <label
      htmlFor="extraImageUpload"
      className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition
        ${uploadingExtra
          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
          : 'border-gray-300 text-gray-400 hover:border-flower-100 hover:text-flower-100'}`}>
      {uploadingExtra ? (
        <div className="w-5 h-5 border-2 border-flower-100 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <svg className="h-6 w-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs">Thêm</span>
        </>
      )}
    </label>
    <input
      id="extraImageUpload"
      type="file"
      accept="image/*"
      multiple // ← cho phép chọn nhiều file
      onChange={handleUploadExtraImage}
      disabled={uploadingExtra}
      className="hidden"
    />
  </div>

</div>



            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="isFeatured"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 accent-flower-100" />
              <label htmlFor="isFeatured" className="text-sm text-gray-700 cursor-pointer">
                ⭐ Đánh dấu là sản phẩm nổi bật
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
            {saving ? 'Đang lưu...' : product ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
