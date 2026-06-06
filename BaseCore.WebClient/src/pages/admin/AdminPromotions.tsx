import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPromotion, setEditPromotion] = useState<any>(null);

  useEffect(() => { fetchPromotions(); }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/Promotions');
      setPromotions(res.data);
    } catch { setPromotions([]); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    await axiosClient.put(`/Promotions/${id}/toggle`);
    fetchPromotions();
  };

  const handleDelete = async (id: number) => {
    await axiosClient.delete(`/Promotions/${id}`);
    fetchPromotions();
  };

  const presets = [
    { name: 'Quốc tế thiếu nhi 1/6', discount: 15,
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7*86400000).toISOString().split('T')[0] },
    { name: 'Tết Trung thu', discount: 20,
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 14*86400000).toISOString().split('T')[0] },
    { name: 'Black Friday', discount: 30,
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 3*86400000).toISOString().split('T')[0] },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý khuyến mãi</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng {promotions.length} chương trình</p>
        </div>
        <button
          onClick={() => { setEditPromotion(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo chương trình
        </button>
      </div>

      {/* Preset nhanh */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => { setEditPromotion(preset); setShowModal(true); }}
            className="bg-white border-2 border-dashed border-flower-100 rounded-2xl p-4 text-left hover:bg-flower-50 transition">
            <span className="text-2xl block mb-2">🎉</span>
            <p className="font-semibold text-gray-800 text-sm">{preset.name}</p>
            <p className="text-flower-100 font-bold text-lg">-{preset.discount}%</p>
            <p className="text-xs text-gray-400 mt-1">Click để tạo nhanh</p>
          </button>
        ))}
      </div>

      {/* Danh sách */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tên chương trình</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Giảm giá</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  </td>
                </tr>
              ))
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  <span className="text-4xl block mb-2">🎉</span>
                  Chưa có chương trình khuyến mãi nào
                </td>
              </tr>
            ) : (
              promotions.map(promo => {
                const now = new Date();
                const isExpired = new Date(promo.endDate) < now;
                const isOngoing = new Date(promo.startDate) <= now && !isExpired;

                return (
                  <tr key={promo.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{promo.name}</p>
                      {promo.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-flower-100">-{promo.discountPercent}%</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>{new Date(promo.startDate).toLocaleDateString('vi-VN')}</p>
                      <p>→ {new Date(promo.endDate).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                        ${isExpired ? 'bg-gray-100 text-gray-500'
                        : isOngoing && promo.isActive ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'}`}>
                        {isExpired ? 'Đã hết hạn'
                          : isOngoing && promo.isActive ? '🟢 Đang diễn ra'
                          : '⏳ Chưa bắt đầu'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(promo.id, promo.isActive)}
                          className={`text-xs px-3 py-1 rounded-lg border transition
                            ${promo.isActive
                              ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                              : 'border-green-200 text-green-500 hover:bg-green-50'}`}>
                          {promo.isActive ? 'Tắt' : 'Bật'}
                        </button>
                        <button
                          onClick={() => { setEditPromotion(promo); setShowModal(true); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PromotionModal
          promotion={editPromotion}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchPromotions(); }}
        />
      )}
    </div>
  );
};

const PromotionModal = ({ promotion, onClose, onSaved }: any) => {
  const [form, setForm] = useState({
    name: promotion?.name || '',
    description: promotion?.description || '',
    discountPercent: promotion?.discountPercent || 10,
    startDate: promotion?.start || promotion?.startDate?.split('T')[0] || '',
    endDate: promotion?.end || promotion?.endDate?.split('T')[0] || '',
    isActive: promotion?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (promotion?.id) {
        await axiosClient.put(`/Promotions/${promotion.id}`, form);
      } else {
        await axiosClient.post('/Promotions', form);
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
          <h3 className="font-bold text-gray-800">
            {promotion?.id ? '✏️ Sửa khuyến mãi' : '➕ Tạo khuyến mãi'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên chương trình *</label>
            <input type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass} placeholder="VD: Quốc tế thiếu nhi 1/6" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className={inputClass} placeholder="Mô tả chương trình..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Giảm giá: <span className="text-flower-100 font-bold">{form.discountPercent}%</span>
            </label>
            <input type="range" min={1} max={70} value={form.discountPercent}
              onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })}
              className="w-full accent-flower-100" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1%</span><span>70%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bắt đầu *</label>
              <input type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kết thúc *</label>
              <input type="date" value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-flower-100" />
            <span className="text-sm text-gray-700">Kích hoạt ngay</span>
          </label>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.startDate || !form.endDate}
            className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
            {saving ? 'Đang lưu...' : promotion?.id ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPromotions;