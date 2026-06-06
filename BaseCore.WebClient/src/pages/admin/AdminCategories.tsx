import { useState, useEffect } from 'react';
import { categoryApi, CategoryResponse } from '../../api/categoryApi';
import { getImageUrl } from '../../utils/imageHelper';
import axiosClient from '../../api/axiosClient';

const AdminCategories = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');

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

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.delete(id);
      setDeleteId(null);
      setDeleteError('');
      fetchCategories();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý danh mục</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Tổng {categories.length} danh mục
          </p>
        </div>
        <button
          onClick={() => { setEditCategory(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm danh mục
        </button>
      </div>

      {/* Grid danh mục */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <span className="text-6xl mb-4">🏷️</span>
          <p className="text-lg font-medium">Chưa có danh mục nào</p>
          <button
            onClick={() => { setEditCategory(null); setShowModal(true); }}
            className="mt-4 px-6 py-2.5 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition">
            Thêm danh mục đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => { setEditCategory(cat); setShowModal(true); }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition cursor-pointer group">

              {/* Ảnh */}
              <div className="relative bg-flower-50 h-36 overflow-hidden">
                {cat.imageUrl ? (
                  <img
                    src={getImageUrl(cat.imageUrl)}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🏷️
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCategory(cat);
                      setShowModal(true);
                    }}
                    className="p-2 bg-white rounded-xl text-blue-500 hover:bg-blue-50 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(cat.id);
                      setDeleteError('');
                    }}
                    className="p-2 bg-white rounded-xl text-red-500 hover:bg-red-50 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Thông tin */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{cat.name}</h3>
                {cat.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-2">{cat.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-flower-50 text-flower-100 px-2.5 py-1 rounded-full font-medium">
                    {cat.productCount} sản phẩm
                  </span>
                  <span className="text-xs text-gray-400">ID: {cat.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <CategoryModal
          category={editCategory}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchCategories(); }}
        />
      )}

      {/* Modal Xóa */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <span className="text-4xl block mb-3">🗑️</span>
              <h3 className="font-bold text-gray-800 text-lg">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bạn có chắc muốn xóa danh mục này không?
              </p>
              {deleteError && (
                <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                  {deleteError}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteId(null); setDeleteError(''); }}
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

// ========== CATEGORY MODAL ==========
const CategoryModal = ({
  category,
  onClose,
  onSaved,
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
    category?.imageUrl
      ? `https://localhost:7175${category.imageUrl}`
      : ''
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">
            {category ? '✏️ Sửa danh mục' : '➕ Thêm danh mục'}
          </h3>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">

          {/* Ảnh */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Ảnh danh mục</label>
            <div className="flex gap-4">
              <div className="w-24 h-24 flex-shrink-0 bg-flower-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                {previewImage ? (
                  <img src={previewImage} alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewImage('')} />
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
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => {
                    setForm({ ...form, imageUrl: e.target.value });
                    setPreviewImage(e.target.value
                      ? `https://localhost:7175${e.target.value}`
                      : '');
                  }}
                  placeholder="/images/categories/..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-flower-100"
                />
              </div>
            </div>
          </div>

          {/* Tên */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Star Wars, Technic..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả danh mục..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
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

export default AdminCategories;