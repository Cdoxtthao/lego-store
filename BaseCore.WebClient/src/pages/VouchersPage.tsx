import { useEffect, useState } from 'react';
import { voucherApi, Voucher, MyVoucher } from '../api/voucherApi';
import { useAuth } from '../context/AuthContext';

const scopeLabel = (v: Voucher) => {
  if (v.scopeType === 'All') return 'Áp dụng cho tất cả sản phẩm';
  if (v.scopeType === 'Birthday') return 'Mã sinh nhật';
  const parts: string[] = [];
  if (v.categoryIds) parts.push('một số danh mục');
  if (v.themeIds) parts.push('một số chủ đề');
  if (v.productIds) parts.push('một số sản phẩm');
  return parts.length ? `Áp dụng cho ${parts.join(', ')}` : 'Áp dụng cho sản phẩm chọn lọc';
};

const VouchersPage = () => {
  const { isAuthenticated } = useAuth();
  const [storeCodes, setStoreCodes] = useState<Voucher[]>([]);
  const [myCodes, setMyCodes] = useState<MyVoucher[]>([]);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadMine = () => {
    if (isAuthenticated) voucherApi.getMine().then(setMyCodes).catch(() => setMyCodes([]));
  };

  useEffect(() => {
    voucherApi.getActive().then(setStoreCodes).catch(() => setStoreCodes([]));
    loadMine();
  }, [isAuthenticated]);

  const applyCode = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (!isAuthenticated) { setResult({ ok: false, msg: 'Vui lòng đăng nhập để nhận mã.' }); return; }
    try {
      const res = await voucherApi.redeem(code.trim());
      setResult({ ok: true, msg: res.message || 'Nhận mã thành công!' });
      setCode('');
      loadMine();
    } catch (err: any) {
      setResult({ ok: false, msg: err.response?.data?.message || 'Mã không hợp lệ.' });
    }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Nhập mã */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🎁 Nhập mã của bạn để nhận khuyến mãi</h1>
          <form onSubmit={applyCode} className="flex gap-2 max-w-md mx-auto mt-4">
            <input value={code} onChange={(e) => { setCode(e.target.value); setResult(null); }}
              placeholder="Nhập mã giảm giá..."
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 bg-flower-50 focus:outline-none focus:ring-2 focus:ring-flower-100" />
            <button type="submit" className="px-6 py-3 rounded-full bg-flower-100 text-white font-semibold hover:bg-flower-150 transition">
              Nhận mã
            </button>
          </form>
          {result && (
            <p className={`mt-3 text-sm font-medium ${result.ok ? 'text-green-600' : 'text-red-500'}`}>{result.msg}</p>
          )}
        </div>

        {/* Mã của cửa hàng */}
        <h2 className="text-lg font-bold text-gray-800 mb-3">Mã khuyến mãi của cửa hàng</h2>
        {storeCodes.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {storeCodes.map(v => (
              <div key={v.id} className="flex rounded-2xl overflow-hidden border border-flower-100 shadow-sm">
                <div className="bg-flower-100 text-white flex flex-col items-center justify-center px-5 py-4 min-w-[90px]">
                  <span className="text-2xl font-extrabold">{v.discountPercent}%</span>
                  <span className="text-[11px]">GIẢM</span>
                </div>
                <div className="p-4 flex-1">
                  <p className="font-semibold text-gray-800">{v.code}</p>
                  {v.description && <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">{scopeLabel(v)}</p>
                  <p className="text-xs text-gray-400 mt-1">HSD: {fmt(v.endDate)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-10">Hiện chưa có mã khuyến mãi nào.</p>
        )}

        {/* Mã của tôi */}
        <h2 className="text-lg font-bold text-gray-800 mb-3">Mã giảm giá của tôi</h2>
        {myCodes.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {myCodes.map(m => (
              <div key={m.userVoucherId} className={`rounded-2xl border p-4 ${m.isUsed ? 'border-gray-200 opacity-60' : 'border-flower-100'}`}>
                <p className="font-semibold text-gray-800">{m.voucher.code} · -{m.voucher.discountPercent}%</p>
                <p className="text-xs text-gray-500 mt-0.5">{scopeLabel(m.voucher)}</p>
                <p className="text-xs text-gray-400 mt-1">HSD: {fmt(m.voucher.endDate)} {m.isUsed && '· Đã dùng'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
            Bạn chưa có mã giảm giá nào. Hãy nhập mã hoặc theo dõi các chương trình của 3TL-Store nhé!
          </div>
        )}
      </div>
    </div>
  );
};

export default VouchersPage;
