import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { getImageUrl } from '../../utils/imageHelper';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Proposal {
  id: number;
  proposalCode: string;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  productImage: string;
  proposedQuantity: number;
  proposedUnitPrice: number;
  totalEstimate: number;
  status: string;
  supplierNote: string | null;
  adminNote: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  processedAt: string | null;
  receiptId: number | null;
}

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusLabels: Record<string, string> = {
  Pending:   '⏳ Chờ duyệt',
  Approved:  '✅ Được duyệt',
  Rejected:  '❌ Bị từ chối',
  Completed: '🎉 Hoàn tất',
};
const statusColors: Record<string, string> = {
  Pending:   'bg-amber-50 text-amber-600 border-amber-200',
  Approved:  'bg-emerald-50 text-emerald-600 border-emerald-200',
  Rejected:  'bg-red-50 text-red-600 border-red-200',
  Completed: 'bg-blue-50 text-blue-600 border-blue-200',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SupplierProposals = () => {
  const location = useLocation();
  const params   = new URLSearchParams(location.search);
  const initStatus = params.get('status') || '';

  const [proposals, setProposals]   = useState<Proposal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState(initStatus);
  const [stats, setStats]           = useState<any>(null);
  const [selected, setSelected]     = useState<Proposal | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [search, setSearch]         = useState('');
  const [deleting, setDeleting]     = useState<number | null>(null);

  // Form state
  const [products, setProducts]     = useState<Product[]>([]);
  const [form, setForm]             = useState({
    productId: '',
    proposedQuantity: '',
    proposedUnitPrice: '',
    supplierNote: '',
    estimatedDelivery: '',
  });
  const [saving, setSaving]         = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        axiosClient.get('/SupplierProposals', { params: filter ? { status: filter } : {} }),
        axiosClient.get('/SupplierProposals/stats'),
      ]);
      setProposals(listRes.data || []);
      setStats(statsRes.data);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get('/Products', { params: { pageSize: 200, page: 1 } });
      setProducts(res.data.items || []);
    } catch { setProducts([]); }
  };

  const openForm = () => {
    fetchProducts();
    setForm({ productId: '', proposedQuantity: '', proposedUnitPrice: '', supplierNote: '', estimatedDelivery: '' });
    setProductSearch('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.productId || !form.proposedQuantity || !form.proposedUnitPrice) return;
    setSaving(true);
    try {
      await axiosClient.post('/SupplierProposals', {
        productId:         Number(form.productId),
        proposedQuantity:  Number(form.proposedQuantity),
        proposedUnitPrice: Number(form.proposedUnitPrice),
        supplierNote:      form.supplierNote || null,
        estimatedDelivery: form.estimatedDelivery || null,
      });
      setShowForm(false);
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    setDeleting(id);
    try {
      await axiosClient.delete(`/SupplierProposals/${id}`);
      fetchAll();
    } finally {
      setDeleting(null);
    }
  };

  const filtered = proposals.filter(p =>
    !search
      || p.proposalCode.toLowerCase().includes(search.toLowerCase())
      || p.productName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === Number(form.productId));
  const estimatedTotal  = selectedProduct && form.proposedQuantity && form.proposedUnitPrice
    ? Number(form.proposedQuantity) * Number(form.proposedUnitPrice)
    : 0;

  const statCards = [
    { label: 'Chờ duyệt',    value: stats?.pending ?? 0,   key: 'Pending',   icon: '⏳', color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'Được duyệt',   value: stats?.approved ?? 0,  key: 'Approved',  icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Bị từ chối',   value: stats?.rejected ?? 0,  key: 'Rejected',  icon: '❌', color: 'text-red-600',     bg: 'bg-red-50'     },
    { label: 'Đã hoàn tất',  value: stats?.completed ?? 0, key: 'Completed', icon: '🎉', color: 'text-blue-600',    bg: 'bg-blue-50'    },
  ];

  const filteredProducts = products.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Đề nghị cung ứng</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Tạo và theo dõi đề nghị gửi hàng lên Admin · Tổng {proposals.length} đề nghị
          </p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo đề nghị mới
        </button>
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
            placeholder="Tìm kiếm đề nghị..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mã đề nghị</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SL đề xuất</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Đơn giá đề xuất</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ước tính</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày gửi</th>
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
                <td colSpan={8} className="text-center py-16 text-gray-400">
                  <span className="text-4xl block mb-2">📤</span>
                  {search ? 'Không tìm thấy đề nghị phù hợp' : 'Chưa có đề nghị nào'}
                  {!search && (
                    <button onClick={openForm}
                      className="mt-4 px-6 py-2 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition block mx-auto">
                      Tạo đề nghị đầu tiên
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}
                  onClick={() => setSelected(p)}
                  className="hover:bg-gray-50 transition cursor-pointer">
                  <td className="px-4 py-3 text-sm font-semibold text-flower-100">{p.proposalCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-flower-50 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={getImageUrl(p.productImage)} alt={p.productName}
                          className="w-full h-full object-contain p-1"
                          onError={e => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-1 max-w-[160px]">{p.productName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{p.proposedQuantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.proposedUnitPrice.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-sm font-bold text-flower-100">{p.totalEstimate.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[p.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {p.status === 'Pending' && (
                      <button
                        onClick={() => handleCancel(p.id)}
                        disabled={deleting === p.id}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                        {deleting === p.id ? '...' : 'Huỷ'}
                      </button>
                    )}
                    {p.status !== 'Pending' && (
                      <button onClick={() => setSelected(p)}
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

      {/* Detail modal */}
      {selected && !showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">📤 Chi tiết đề nghị</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selected.proposalCode}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
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
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'SL đề xuất', value: `${selected.proposedQuantity} sản phẩm` },
                  { label: 'Đơn giá đề xuất', value: `${selected.proposedUnitPrice.toLocaleString('vi-VN')}đ` },
                  { label: 'Tổng ước tính', value: `${selected.totalEstimate.toLocaleString('vi-VN')}đ`, highlight: true },
                  { label: 'Trạng thái', value: statusLabels[selected.status] || selected.status },
                  { label: 'Ngày gửi', value: new Date(selected.createdAt).toLocaleDateString('vi-VN') },
                  { label: 'Dự kiến giao', value: selected.estimatedDelivery ? new Date(selected.estimatedDelivery).toLocaleDateString('vi-VN') : '—' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.highlight ? 'text-flower-100' : 'text-gray-800'}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              {selected.supplierNote && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">📝 Ghi chú của bạn</p>
                  <p className="text-sm text-blue-800">{selected.supplierNote}</p>
                </div>
              )}
              {selected.adminNote && (
                <div className={`rounded-xl p-3 ${selected.status === 'Rejected' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className={`text-xs font-medium mb-1 ${selected.status === 'Rejected' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selected.status === 'Rejected' ? '❌ Lý do từ chối' : '✅ Phản hồi từ Admin'}
                  </p>
                  <p className={`text-sm ${selected.status === 'Rejected' ? 'text-red-800' : 'text-emerald-800'}`}>
                    {selected.adminNote}
                  </p>
                </div>
              )}
              {selected.receiptId && (
                <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-0.5">📋 Biên lai đã tạo</p>
                    <p className="text-sm text-blue-800 font-semibold">Biên lai #{selected.receiptId}</p>
                  </div>
                  <span className="text-blue-400 text-xl">→</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setSelected(null)}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create proposal modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-800">📤 Tạo đề nghị cung ứng</h3>
              <button onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product search & select */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sản phẩm muốn cung ứng *</label>
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 mb-2"
                />
                {selectedProduct ? (
                  <div className="flex items-center gap-3 bg-flower-50 rounded-xl p-3 border border-flower-100">
                    <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex-shrink-0">
                      <img src={getImageUrl(selectedProduct.imageUrl)} alt={selectedProduct.name}
                        className="w-full h-full object-contain p-1"
                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{selectedProduct.name}</p>
                      <p className="text-xs text-gray-400">Tồn kho: {selectedProduct.stockQuantity}</p>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, productId: '' }))}
                      className="text-gray-400 hover:text-red-500 transition">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-50">
                    {filteredProducts.slice(0, 20).map(p => (
                      <button key={p.id}
                        onClick={() => { setForm(f => ({ ...f, productId: String(p.id) })); setProductSearch(p.name); }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left">
                        <div className="w-8 h-8 bg-flower-50 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={getImageUrl(p.imageUrl)} alt={p.name}
                            className="w-full h-full object-contain p-1"
                            onError={e => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">Tồn: {p.stockQuantity} · Giá bán: {p.price.toLocaleString('vi-VN')}đ</p>
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-center py-4 text-sm text-gray-400">Không tìm thấy sản phẩm</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity & price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Số lượng đề xuất *</label>
                  <input type="number" min={1} value={form.proposedQuantity}
                    onChange={e => setForm(f => ({ ...f, proposedQuantity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Đơn giá nhập sỉ (đ) *</label>
                  <input type="number" min={0} value={form.proposedUnitPrice}
                    onChange={e => setForm(f => ({ ...f, proposedUnitPrice: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    placeholder="0" />
                </div>
              </div>

              {/* Estimated delivery */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ngày dự kiến giao hàng</label>
                <input type="date" value={form.estimatedDelivery}
                  onChange={e => setForm(f => ({ ...f, estimatedDelivery: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100" />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ghi chú gửi Admin</label>
                <textarea value={form.supplierNote}
                  onChange={e => setForm(f => ({ ...f, supplierNote: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                  placeholder="Mô tả thêm về hàng cung ứng, điều khoản, ..." />
              </div>

              {/* Preview */}
              {estimatedTotal > 0 && (
                <div className="bg-flower-50 rounded-xl p-4 flex items-center justify-between border border-flower-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Tổng giá trị ước tính</p>
                    <p className="text-xl font-bold text-flower-100">{estimatedTotal.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{form.proposedQuantity} sản phẩm</p>
                    <p className="text-xs text-gray-400">× {Number(form.proposedUnitPrice).toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.productId || !form.proposedQuantity || !form.proposedUnitPrice}
                className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang gửi...</>
                ) : '📤 Gửi đề nghị'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProposals;
