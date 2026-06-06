import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/Suppliers');
      setSuppliers(res.data);
    } catch { setSuppliers([]); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    await axiosClient.delete(`/Suppliers/${id}`);
    fetchSuppliers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý đối tác cung ứng</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng {suppliers.length} đối tác</p>
        </div>
        <button
          onClick={() => { setEditSupplier(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm đối tác
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <span className="text-5xl block mb-3">🤝</span>
            <p className="font-medium text-gray-600 mb-1">Chưa có đối tác nào</p>
            <button onClick={() => { setEditSupplier(null); setShowModal(true); }}
              className="mt-3 px-6 py-2.5 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition">
              Thêm đối tác đầu tiên
            </button>
          </div>
        ) : (
          suppliers.map(sup => (
            <div key={sup.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-flower-50 rounded-xl flex items-center justify-center text-2xl">
                  🏭
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditSupplier(sup); setShowModal(true); }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(sup.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{sup.companyName}</h3>
              <p className="text-sm text-gray-500 mb-3">{sup.contactName}</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5 text-flower-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {sup.email}
                </div>
                {sup.phoneNumber && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="h-3.5 w-3.5 text-flower-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {sup.phoneNumber}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                  ${sup.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {sup.isActive ? '🟢 Đang hợp tác' : '⚫ Ngừng hợp tác'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <SupplierModal
          supplier={editSupplier}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchSuppliers(); }}
        />
      )}
    </div>
  );
};

const SupplierModal = ({ supplier, onClose, onSaved }: any) => {
  const [form, setForm] = useState({
    companyName: supplier?.companyName || '',
    contactName: supplier?.contactName || '',
    email: supplier?.email || '',
    phoneNumber: supplier?.phoneNumber || '',
    address: supplier?.address || '',
    isActive: supplier?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (supplier?.id) {
        await axiosClient.put(`/Suppliers/${supplier.id}`, form);
      } else {
        await axiosClient.post('/Suppliers', form);
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
            {supplier?.id ? '✏️ Sửa đối tác' : '➕ Thêm đối tác mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên công ty *</label>
            <input type="text" value={form.companyName}
              onChange={e => setForm({ ...form, companyName: e.target.value })}
              className={inputClass} placeholder="Công ty TNHH..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Người liên hệ *</label>
            <input type="text" value={form.contactName}
              onChange={e => setForm({ ...form, contactName: e.target.value })}
              className={inputClass} placeholder="Nguyễn Văn A" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={inputClass} placeholder="email@company.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
              <input type="tel" value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                className={inputClass} placeholder="0912345678" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Địa chỉ</label>
            <input type="text" value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className={inputClass} placeholder="Địa chỉ công ty..." />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-flower-100" />
            <span className="text-sm text-gray-700">Đang hợp tác</span>
          </label>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Hủy
          </button>
          <button onClick={handleSave}
            disabled={saving || !form.companyName || !form.contactName || !form.email}
            className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
            {saving ? 'Đang lưu...' : supplier?.id ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSuppliers;