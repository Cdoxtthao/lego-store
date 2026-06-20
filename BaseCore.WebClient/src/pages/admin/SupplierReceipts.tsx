import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { getImageUrl } from '../../utils/imageHelper';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Receipt {
  id: number;
  receiptCode: string;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  adminNote: string | null;
  supplierNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusLabels: Record<string, string> = {
  Pending:   '⏳ Chờ xác nhận',
  Confirmed: '✅ Đã xác nhận',
  Disputed:  '⚠️ Đang khiếu nại',
  Resolved:  '🔧 Đã giải quyết',
};
const statusColors: Record<string, string> = {
  Pending:   'bg-amber-50 text-amber-600 border-amber-200',
  Confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Disputed:  'bg-red-50 text-red-600 border-red-200',
  Resolved:  'bg-blue-50 text-blue-600 border-blue-200',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SupplierReceipts = () => {
  const location = useLocation();
  const params   = new URLSearchParams(location.search);
  const initStatus = params.get('status') || '';

  const [receipts, setReceipts]       = useState<Receipt[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState(initStatus);
  const [stats, setStats]             = useState<any>(null);
  const [selected, setSelected]       = useState<Receipt | null>(null);
  const [actionModal, setActionModal] = useState<'confirm' | 'dispute' | null>(null);
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        axiosClient.get('/SupplierReceipts', { params: filter ? { status: filter } : {} }),
        axiosClient.get('/SupplierReceipts/stats'),
      ]);
      setReceipts(listRes.data || []);
      setStats(statsRes.data);
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async () => {
    if (!selected || !actionModal) return;
    setSaving(true);
    try {
      await axiosClient.put(`/SupplierReceipts/${selected.id}/${actionModal}`, { note });
      setActionModal(null);
      setSelected(null);
      setNote('');
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const filtered = receipts.filter(r =>
    !search || r.receiptCode.toLowerCase().includes(search.toLowerCase())
      || r.productName.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: 'Chờ xác nhận', value: stats?.pending ?? 0, key: 'Pending',   icon: '⏳', color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'Đã xác nhận',  value: stats?.confirmed ?? 0, key: 'Confirmed', icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Đang khiếu nại', value: stats?.disputed ?? 0, key: 'Disputed', icon: '⚠️', color: 'text-red-600',     bg: 'bg-red-50'     },
    { label: 'Đã giải quyết', value: stats?.resolved ?? 0, key: 'Resolved', icon: '🔧', color: 'text-blue-600',    bg: 'bg-blue-50'    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý biên lai</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Xem và xác nhận biên lai từ Admin · Tổng {receipts.length} biên lai
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <button key={s.key}
            onClick={() => setFilter(filter === s.key ? '' : s.key)}
            className={`bg-white rounded-2xl border p-4 text-left transition hover:shadow-md
              ${filter === s.key ? 'border-flower-100 shadow-md' : 'border-gray-100'}`}>
            <div className={`inline-flex p-2 rounded-xl ${s.bg} mb-2`}>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{loading ? '—' : s.value}</p>
            <p className={`text-xs font-medium mt-0.5 ${s.color}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Total confirmed amount */}
      {stats?.totalAmount > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 px-6 py-4 flex items-center gap-4">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-xs font-medium text-emerald-600">Tổng giá trị biên lai đã xác nhận</p>
            <p className="text-xl font-bold text-emerald-700">{stats.totalAmount.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="flex flex-wrap gap-2 items-center">
        {[{ key: '', label: 'Tất cả' }, ...statCards.map(s => ({ key: s.key, label: statusLabels[s.key] }))].map(tab => (
          <button key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${filter === tab.key
                ? 'bg-flower-100 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-flower-100'}`}>
            {tab.label}
          </button>
        ))}
        <div className="ml-auto relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm biên lai..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mã biên lai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SL</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Đơn giá</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tổng tiền</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày tạo</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-4 py-3">
                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-14 text-gray-400">
                  <span className="text-4xl block mb-2">📋</span>
                  {search ? 'Không tìm thấy biên lai phù hợp' : 'Chưa có biên lai nào'}
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}
                  onClick={() => setSelected(r)}
                  className="hover:bg-gray-50 transition cursor-pointer">
                  <td className="px-4 py-3 text-sm font-semibold text-flower-100">{r.receiptCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-flower-50 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={getImageUrl(r.productImage)} alt={r.productName}
                          className="w-full h-full object-contain p-1"
                          onError={e => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-1 max-w-[160px]">{r.productName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{r.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.unitPrice.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-sm font-bold text-flower-100">{r.totalAmount.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[r.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {r.status === 'Pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelected(r); setActionModal('confirm'); }}
                          className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium">
                          Xác nhận
                        </button>
                        <button
                          onClick={() => { setSelected(r); setActionModal('dispute'); }}
                          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium">
                          Khiếu nại
                        </button>
                      </div>
                    )}
                    {r.status !== 'Pending' && (
                      <button
                        onClick={() => setSelected(r)}
                        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                        Chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail / Action modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setSelected(null); setActionModal(null); setNote(''); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">
                  {actionModal === 'confirm' ? '✅ Xác nhận biên lai'
                    : actionModal === 'dispute' ? '⚠️ Khiếu nại biên lai'
                    : '📋 Chi tiết biên lai'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{selected.receiptCode}</p>
              </div>
              <button onClick={() => { setSelected(null); setActionModal(null); setNote(''); }}
                className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              {/* Product info */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  <img src={getImageUrl(selected.productImage)} alt={selected.productName}
                    className="w-full h-full object-contain p-1"
                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selected.productName}</p>
                  <p className="text-xs text-gray-400">ID #{selected.productId}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Số lượng', value: `${selected.quantity} sản phẩm` },
                  { label: 'Đơn giá', value: `${selected.unitPrice.toLocaleString('vi-VN')}đ` },
                  { label: 'Tổng tiền', value: `${selected.totalAmount.toLocaleString('vi-VN')}đ`, highlight: true },
                  { label: 'Trạng thái', value: statusLabels[selected.status] || selected.status },
                  { label: 'Ngày tạo', value: new Date(selected.createdAt).toLocaleDateString('vi-VN') },
                  { label: 'Xử lý lúc', value: selected.processedAt ? new Date(selected.processedAt).toLocaleDateString('vi-VN') : '—' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.highlight ? 'text-flower-100' : 'text-gray-800'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selected.adminNote && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">📝 Ghi chú từ Admin</p>
                  <p className="text-sm text-blue-800">{selected.adminNote}</p>
                </div>
              )}
              {selected.supplierNote && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-amber-600 mb-1">💬 Phản hồi của bạn</p>
                  <p className="text-sm text-amber-800">{selected.supplierNote}</p>
                </div>
              )}

              {/* Action note input */}
              {actionModal && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {actionModal === 'confirm' ? 'Ghi chú xác nhận (tuỳ chọn)' : 'Lý do khiếu nại *'}
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    placeholder={actionModal === 'confirm'
                      ? 'Nhập ghi chú nếu cần...'
                      : 'Mô tả sai lệch, ví dụ: thiếu hàng, sai số lượng...'}
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { setSelected(null); setActionModal(null); setNote(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                {actionModal ? 'Huỷ' : 'Đóng'}
              </button>
              {actionModal === 'confirm' && (
                <button onClick={handleAction} disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50">
                  {saving ? 'Đang gửi...' : '✅ Xác nhận biên lai'}
                </button>
              )}
              {actionModal === 'dispute' && (
                <button onClick={handleAction} disabled={saving || !note.trim()}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
                  {saving ? 'Đang gửi...' : '⚠️ Gửi khiếu nại'}
                </button>
              )}
              {!actionModal && selected.status === 'Pending' && (
                <>
                  <button
                    onClick={() => setActionModal('confirm')}
                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition">
                    Xác nhận
                  </button>
                  <button
                    onClick={() => setActionModal('dispute')}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition">
                    Khiếu nại
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierReceipts;
