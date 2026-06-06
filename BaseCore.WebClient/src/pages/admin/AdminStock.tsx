import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { getImageUrl } from '../../utils/imageHelper';

const AdminStock = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'tracking'>('import');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchRes, productRes] = await Promise.all([
        axiosClient.get('/StockBatches').catch(() => ({ data: [] })),
        axiosClient.get('/Products', { params: { pageSize: 100, page: 1 } }),
      ]);
      setBatches(batchRes.data);
      setProducts(productRes.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý kho hàng</h2>
          <p className="text-sm text-gray-400 mt-0.5">Theo dõi nhập/xuất kho theo lô</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nhập kho mới
        </button>
      </div>

      {/* Thống kê tồn kho */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng sản phẩm', value: products.length, icon: '📦', color: 'bg-blue-50 text-blue-600' },
          { label: 'Còn hàng', value: products.filter(p => p.stockQuantity > 5).length, icon: '✅', color: 'bg-green-50 text-green-600' },
          { label: 'Sắp hết (≤5)', value: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length, icon: '⚠️', color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Hết hàng', value: products.filter(p => p.stockQuantity === 0).length, icon: '❌', color: 'bg-red-50 text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className={`inline-flex p-2 rounded-xl ${stat.color} mb-2`}>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'import', label: '📥 Nhập kho' },
          { key: 'tracking', label: '📊 Theo dõi tồn kho' },
          { key: 'export', label: '📤 Lịch sử xuất' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${activeTab === tab.key
                ? 'bg-flower-100 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-flower-100'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Theo dõi tồn kho */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Giá</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tồn kho</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                products
                  .sort((a, b) => a.stockQuantity - b.stockQuantity)
                  .map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-flower-50 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={getImageUrl(p.imageUrl)} alt={p.name}
                              className="w-full h-full object-contain p-1"
                              onError={e => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                            <p className="text-xs text-gray-400">#{p.setNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-flower-100 font-medium">
                        {p.price.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                            <div
                              className={`h-2 rounded-full ${p.stockQuantity === 0 ? 'bg-red-400' : p.stockQuantity <= 5 ? 'bg-yellow-400' : 'bg-green-400'}`}
                              style={{ width: `${Math.min(100, (p.stockQuantity / 50) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-700">{p.stockQuantity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                          ${p.stockQuantity === 0 ? 'bg-red-50 text-red-600'
                          : p.stockQuantity <= 5 ? 'bg-yellow-50 text-yellow-600'
                          : 'bg-green-50 text-green-600'}`}>
                          {p.stockQuantity === 0 ? 'Hết hàng'
                            : p.stockQuantity <= 5 ? `⚠️ Còn ${p.stockQuantity}`
                            : `✅ Còn ${p.stockQuantity}`}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Nhập kho */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {batches.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-2">📥</span>
              <p>Chưa có lô hàng nào được nhập</p>
              <button onClick={() => setShowModal(true)}
                className="mt-4 px-6 py-2.5 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition">
                Nhập kho ngay
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Mã lô</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Sản phẩm</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">SL nhập</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Giá nhập</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Ngày nhập</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-gray-50 transition">
                    <td className="py-2.5 text-sm font-mono text-flower-100">{batch.batchCode}</td>
                    <td className="py-2.5 text-sm text-gray-700">{batch.productName}</td>
                    <td className="py-2.5 text-sm font-semibold text-gray-800">{batch.quantity}</td>
                    <td className="py-2.5 text-sm text-gray-600">{batch.costPrice?.toLocaleString('vi-VN')}đ</td>
                    <td className="py-2.5 text-xs text-gray-400">
                      {new Date(batch.importDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${batch.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {batch.status === 'Active' ? 'Đang dùng' : batch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Lịch sử xuất */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center py-12 text-gray-400">
          <span className="text-4xl block mb-2">📤</span>
          <p>Lịch sử xuất kho được cập nhật tự động khi có đơn hàng</p>
        </div>
      )}

      {/* Modal nhập kho */}
      {showModal && (
        <StockImportModal
          products={products}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
};

const StockImportModal = ({ products, onClose, onSaved }: any) => {
  const [form, setForm] = useState({
    productId: '',
    quantity: 0,
    costPrice: 0,
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.productId || form.quantity <= 0) return;
    setSaving(true);
    try {
      await axiosClient.post('/StockBatches', {
        ...form,
        productId: Number(form.productId),
        batchCode: `LOT-${Date.now()}`,
      });

      // Cập nhật tồn kho sản phẩm
      const product = products.find((p: any) => p.id === Number(form.productId));
      if (product) {
        await axiosClient.put(`/Products/${form.productId}`, {
          stockQuantity: product.stockQuantity + form.quantity,
        });
      }

      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">📥 Nhập kho mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sản phẩm *</label>
            <select value={form.productId}
              onChange={e => setForm({ ...form, productId: e.target.value })}
              className={inputClass}>
              <option value="">Chọn sản phẩm</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Còn: {p.stockQuantity})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Số lượng nhập *</label>
              <input type="number" min={1} value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Giá nhập (đ)</label>
              <input type="number" min={0} value={form.costPrice}
                onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}
                className={inputClass} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <textarea value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              rows={2} className={inputClass} placeholder="Ghi chú về lô hàng..." />
          </div>

          {/* Preview */}
          {form.productId && form.quantity > 0 && (
            <div className="bg-flower-50 rounded-xl p-3 text-sm">
              <p className="text-gray-600">
                Sau khi nhập: tồn kho sẽ tăng thêm
                <span className="font-bold text-flower-100 mx-1">{form.quantity}</span>
                sản phẩm
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Hủy
          </button>
          <button onClick={handleSave}
            disabled={saving || !form.productId || form.quantity <= 0}
            className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Xác nhận nhập kho'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminStock;