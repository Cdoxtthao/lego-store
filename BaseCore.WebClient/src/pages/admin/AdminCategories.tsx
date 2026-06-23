import { useState, useEffect } from 'react';
import { categoryApi, CategoryResponse } from '../../api/categoryApi';
import { themeApi, ThemeResponse } from '../../api/themeApi';
import { getImageUrl } from '../../utils/imageHelper';
import { productApi } from '../../api/productApi';
import { ProductResponse } from '../../types';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const AdminCategories = () => {
  const { isAdmin, isSeller } = useAuth();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryResponse | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);
  const [deleteCatError, setDeleteCatError] = useState('');

  // Theme panel state
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [themes, setThemes] = useState<ThemeResponse[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editTheme, setEditTheme] = useState<ThemeResponse | null>(null);
  const [deleteThemeId, setDeleteThemeId] = useState<number | null>(null);
  const [deleteThemeError, setDeleteThemeError] = useState('');

  // Products state
  const [selectedTheme, setSelectedTheme] = useState<ThemeResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll();
      setCategories(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = async (categoryId: number) => {
    setThemesLoading(true);
    try {
      const res = await themeApi.getAll(categoryId);
      setThemes(res);
    } finally {
      setThemesLoading(false);
    }
  };

  const fetchProducts = async (categoryId: number, themeId?: number) => {
    setProductsLoading(true);
    try {
      const res = await productApi.getAll({ categoryId, themeId, pageSize: 50 });
      setProducts(res.items);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSelectCategory = (cat: CategoryResponse) => {
    setSelectedCategory(cat);
    setSelectedTheme(null);
    fetchThemes(cat.id);
    fetchProducts(cat.id);
  };

  const handleSelectTheme = (theme: ThemeResponse) => {
    setSelectedTheme(theme);
    if (selectedCategory) {
      fetchProducts(selectedCategory.id, theme.id);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoryApi.delete(id);
      setDeleteCatId(null);
      setDeleteCatError('');
      if (selectedCategory?.id === id) setSelectedCategory(null);
      fetchCategories();
    } catch (err: any) {
      setDeleteCatError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteTheme = async (id: number) => {
    if (!selectedCategory) return;
    try {
      // Gỡ chủ đề khỏi danh mục đang xem — chủ đề vẫn còn nếu đang thuộc danh mục khác
      await themeApi.unlinkFromCategory(id, selectedCategory.id);
      setDeleteThemeId(null);
      setDeleteThemeError('');
      if (selectedTheme?.id === id) setSelectedTheme(null);
      fetchThemes(selectedCategory.id);
      fetchCategories();
    } catch (err: any) {
      setDeleteThemeError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý danh mục & chủ đề</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Tổng {categories.length} danh mục
            {selectedCategory && ` · ${themes.length} chủ đề trong "${selectedCategory.name}"`}
          </p>
        </div>
        {(isAdmin || isSeller) && (
        <button
          onClick={() => { setEditCategory(null); setShowCatModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm danh mục
        </button>
        )}
      </div>

      {/* Layout */}
      {!selectedCategory ? (
        <div className="w-full">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span className="text-6xl mb-4">🏷️</span>
              <p className="text-lg font-medium">Chưa có danh mục nào</p>
              {(isAdmin || isSeller) && (
              <button
                onClick={() => { setEditCategory(null); setShowCatModal(true); }}
                className="mt-4 px-6 py-2.5 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition">
                Thêm danh mục đầu tiên
              </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-lg transition cursor-pointer group">

                  {/* Ảnh */}
                  <div className="relative bg-flower-50 h-32 overflow-hidden">
                    {cat.imageUrl ? (
                      <img
                        src={getImageUrl(cat.imageUrl)}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏷️</div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      {(isAdmin || isSeller) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditCategory(cat); setShowCatModal(true); }}
                        className="p-2 bg-white rounded-xl text-blue-500 hover:bg-blue-50 transition">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      )}
                      {(isAdmin || isSeller) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteCatId(cat.id); setDeleteCatError(''); }}
                        className="p-2 bg-white rounded-xl text-red-500 hover:bg-red-50 transition">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{cat.name}</h3>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs bg-flower-50 text-flower-100 px-2 py-0.5 rounded-full font-medium">
                        {cat.productCount} SP
                      </span>
                      <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        {cat.themeCount} chủ đề
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* TOP: Horizontal Category Strip */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                📁 Danh mục
              </h3>
              <button onClick={() => setSelectedCategory(null)} className="text-sm text-blue-500 hover:underline">
                Hiển thị tất cả
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
              {categories.map(cat => (
                <div key={cat.id} onClick={() => handleSelectCategory(cat)}
                  className={`flex-shrink-0 w-48 bg-white rounded-xl border-2 overflow-hidden hover:shadow-md transition cursor-pointer snap-start group
                    ${selectedCategory.id === cat.id ? 'border-flower-100 shadow-md ring-2 ring-flower-50' : 'border-gray-100'}`}>
                  <div className="h-16 bg-flower-50 relative overflow-hidden flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={getImageUrl(cat.imageUrl)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <span className="text-2xl">🏷️</span>
                    )}
                  </div>
                  <div className="p-2 text-center bg-white border-t border-gray-50">
                    <h3 className="font-semibold text-gray-800 text-xs truncate">{cat.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM: Split Layout Themes | Products */}
          <div className="flex gap-6">
            
            {/* LEFT: Themes Panel */}
            <div className="w-1/2 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  🏷️ Chủ đề · {selectedCategory.name}
                </h3>
                {(isAdmin || isSeller) && (
                <button
                  onClick={() => { setEditTheme(null); setShowThemeModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-flower-100 text-white rounded-xl text-xs font-medium hover:bg-flower-150 transition">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm chủ đề
                </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {themesLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : themes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <span className="text-4xl mb-3">🏷️</span>
                    <p className="text-sm font-medium">Chưa có chủ đề nào</p>
                    {(isAdmin || isSeller) && (
                    <button
                      onClick={() => { setEditTheme(null); setShowThemeModal(true); }}
                      className="mt-3 px-4 py-2 bg-flower-100 text-white rounded-full text-xs hover:bg-flower-150 transition">
                      Thêm chủ đề đầu tiên
                    </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-50">
                      {themes.map(theme => (
                        <tr key={theme.id} 
                            onClick={() => handleSelectTheme(theme)}
                            className={`transition cursor-pointer ${selectedTheme?.id === theme.id ? 'bg-flower-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${selectedTheme?.id === theme.id ? 'text-flower-100' : 'text-gray-800'}`}>
                              {theme.name}
                            </span>
                            {theme.categories.length > 1 && (
                              <span className="ml-2 text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-medium"
                                title={theme.categories.map(c => c.name).join(', ')}>
                                +{theme.categories.length - 1} danh mục khác
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-400 line-clamp-1">{theme.description || '—'}</span>
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {(isAdmin || isSeller) && (
                              <button
                                onClick={() => { setEditTheme(theme); setShowThemeModal(true); }}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              )}
                              {(isAdmin || isSeller) && (
                              <button
                                onClick={() => { setDeleteThemeId(theme.id); setDeleteThemeError(''); }}
                                title="Gỡ khỏi danh mục này"
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
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* RIGHT: Products Panel */}
            <div className="w-1/2 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  📦 Sản phẩm {selectedTheme ? `· ${selectedTheme.name}` : `· ${selectedCategory.name}`}
                </h3>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm min-h-[300px]">
                {productsLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <span className="text-4xl mb-3">📦</span>
                    <p className="text-sm font-medium">Chưa có sản phẩm nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {products.map(product => (
                      <div key={product.id} className="border border-gray-100 rounded-xl p-3 flex gap-3 hover:shadow-md transition bg-gray-50/50">
                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          {product.imageUrl ? (
                            <img src={getImageUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-xs line-clamp-2" title={product.name}>{product.name}</h4>
                          <p className="text-flower-100 font-bold text-sm mt-1">{product.price.toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <CategoryModal
          category={editCategory}
          onClose={() => setShowCatModal(false)}
          onSaved={() => { setShowCatModal(false); fetchCategories(); }}
        />
      )}

      {/* Theme Modal */}
      {showThemeModal && selectedCategory && (
        <ThemeModal
          theme={editTheme}
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          onClose={() => setShowThemeModal(false)}
          onSaved={() => { setShowThemeModal(false); fetchThemes(selectedCategory.id); }}
        />
      )}

      {/* Delete Category Confirm */}
      {deleteCatId && (
        <ConfirmDialog
          title="Xóa danh mục"
          message="Bạn có chắc muốn xóa danh mục này không? Liên kết chủ đề của danh mục này sẽ bị xóa (các chủ đề vẫn còn nếu đang thuộc danh mục khác)."
          error={deleteCatError}
          onCancel={() => { setDeleteCatId(null); setDeleteCatError(''); }}
          onConfirm={() => handleDeleteCategory(deleteCatId)}
        />
      )}

      {/* Delete Theme Confirm */}
      {deleteThemeId && (
        <ConfirmDialog
          title="Gỡ chủ đề khỏi danh mục"
          message="Chủ đề sẽ được gỡ khỏi danh mục này. Nếu chủ đề này còn thuộc danh mục khác thì sẽ không bị xóa hoàn toàn."
          error={deleteThemeError}
          onCancel={() => { setDeleteThemeId(null); setDeleteThemeError(''); }}
          onConfirm={() => handleDeleteTheme(deleteThemeId)}
        />
      )}
    </div>
  );
};

// ========== CONFIRM DIALOG ==========
const ConfirmDialog = ({
  title, message, error, onCancel, onConfirm,
}: {
  title: string; message: string; error: string;
  onCancel: () => void; onConfirm: () => void;
}) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <div className="text-center mb-5">
        <span className="text-4xl block mb-3">🗑️</span>
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
        {error && <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded-lg">{error}</p>}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
          Hủy
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition">
          Xóa
        </button>
      </div>
    </div>
  </div>
);

// ========== CATEGORY MODAL ==========
const CategoryModal = ({
  category, onClose, onSaved,
}: {
  category: CategoryResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
  });
  const [previewImage, setPreviewImage] = useState(
    category?.imageUrl ? getImageUrl(category.imageUrl) : ''
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosClient.post('/Image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch {
      setError('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập tên danh mục'); return; }
    setSaving(true);
    try {
      if (category) {
        await categoryApi.update(category.id, form);
      } else {
        await categoryApi.create(form);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">
            {category ? '✏️ Sửa danh mục' : '➕ Thêm danh mục'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Ảnh danh mục</label>
            <div className="flex gap-4">
              <div className="w-24 h-24 flex-shrink-0 bg-flower-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" onError={() => setPreviewImage('')} />
                ) : (
                  <span className="text-3xl">🏷️</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label htmlFor="catImageUpload"
                  className={`flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition text-sm
                    ${uploading ? 'border-gray-200 text-gray-300' : 'border-flower-100 text-flower-100 hover:bg-flower-50'}`}>
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-flower-100 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Chọn ảnh
                    </>
                  )}
                </label>
                <input id="catImageUpload" type="file" accept="image/*"
                  onChange={handleUpload} disabled={uploading} className="hidden" />
                <input type="text" value={form.imageUrl}
                  onChange={(e) => {
                    setForm({ ...form, imageUrl: e.target.value });
                    setPreviewImage(e.target.value ? getImageUrl(e.target.value) : '');
                  }}
                  placeholder="/images/categories/..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-flower-100" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Lego, Robot, Gấu bông..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả danh mục..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 resize-none" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
            {saving ? 'Đang lưu...' : category ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== THEME MODAL ==========
const ThemeModal = ({
  theme, categoryId, categoryName, onClose, onSaved,
}: {
  theme: ThemeResponse | null;
  categoryId: number;
  categoryName: string;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    name: theme?.name || '',
    description: theme?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Chỉ khi TẠO MỚI: tải toàn bộ chủ đề hiện có để gợi ý khi trùng tên
  // (việc gộp/tái sử dụng chủ đề trùng tên do Backend xử lý — đây chỉ là gợi ý hiển thị)
  const [allThemes, setAllThemes] = useState<ThemeResponse[]>([]);
  useEffect(() => {
    if (!theme) {
      themeApi.getAll().then(setAllThemes).catch(() => {});
    }
  }, [theme]);

  const matchedTheme = !theme
    ? allThemes.find(t => t.name.trim().toLowerCase() === form.name.trim().toLowerCase())
    : undefined;

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập tên chủ đề'); return; }
    setSaving(true);
    try {
      if (theme) {
        await themeApi.update(theme.id, form);
      } else {
        await themeApi.create({ ...form, categoryId });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              {theme ? '✏️ Sửa chủ đề' : '➕ Thêm chủ đề'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Danh mục: {categoryName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tên chủ đề <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Space, City, Fantasy..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100" />
            {matchedTheme && (
              <p className="text-xs text-blue-500 bg-blue-50 mt-2 px-3 py-2 rounded-lg">
                ✓ Đã có chủ đề "{matchedTheme.name}"
                {matchedTheme.categories.length > 0 && (
                  <> (đang thuộc: {matchedTheme.categories.map(c => c.name).join(', ')})</>
                )}
                . Hệ thống sẽ dùng lại chủ đề này và chỉ thêm vào danh mục "{categoryName}".
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chủ đề..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 resize-none" />
          </div>

          {theme && theme.categories.length > 0 && (
            <p className="text-xs text-gray-400">
              Sửa tên/mô tả sẽ áp dụng cho tất cả danh mục đang dùng chủ đề này: {theme.categories.map(c => c.name).join(', ')}.
            </p>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
            {saving ? 'Đang lưu...' : theme ? 'Cập nhật' : matchedTheme ? 'Thêm vào danh mục' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;