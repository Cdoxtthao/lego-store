import { useEffect, useState, useCallback } from 'react';
import { productApi } from '../api/productApi';
import { promotionApi, PromotionResponse } from '../api/promotionApi';
import { campaignApi } from '../api/campaignApi';
import { getImageUrl } from '../utils/imageHelper';
import { ProductResponse } from '../types';
import ProductCard from '../components/ProductCard';

const PAGE_SIZE = 12;

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

// ============ KHỐI VÉ GIẢM GIÁ (Voucher Ticket) ============
const VoucherTicket = ({ pr }: { pr: PromotionResponse }) => {
  const [copied, setCopied] = useState(false);

  // Phát hiện tự động mã code từ tên hoặc mô tả khuyến mãi
  const detectCode = () => {
    const text = `${pr.name} ${pr.description || ''}`;
    const codeMatch = text.match(/(?:Mã code|code|mã|Code|Voucher):\s*([A-Za-z0-9-]+)/i) || 
                      text.match(/([A-Z]+[0-9]+|[A-Z0-9-]{4,12})/);
    return codeMatch ? codeMatch[1].trim() : null;
  };

  const code = detectCode();

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex items-stretch select-none">
      {/* Left stub - Discount */}
      <div className="w-20 bg-gradient-to-br from-rose-400 to-pink-500 text-white flex flex-col items-center justify-center p-2 text-center relative flex-shrink-0">
        <span className="text-xl font-black tracking-tighter">-{pr.discountPercent}%</span>
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">Giảm</span>
        
        {/* Notch cutout */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-flower-50 border-r border-rose-100 rounded-full" />
      </div>

      {/* Dashed divider */}
      <div className="w-[1px] border-l-2 border-dashed border-rose-200 relative my-1.5 flex-shrink-0">
        <div className="absolute -top-[10px] -left-[5px] w-2.5 h-2.5 bg-flower-50 border-b border-rose-100 rounded-full" />
        <div className="absolute -bottom-[10px] -left-[5px] w-2.5 h-2.5 bg-flower-50 border-t border-rose-100 rounded-full" />
      </div>

      {/* Right details */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0 bg-white">
        <div>
          <h4 className="text-xs font-bold text-gray-800 truncate">{pr.name}</h4>
          <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {pr.description ? pr.description.replace(/(?:Mã code|code|mã|Code|Voucher):\s*[A-Za-z0-9-]+/i, '').trim() : 'Áp dụng cho các sản phẩm trong chương trình.'}
          </p>
        </div>

        {code && (
          <div className="mt-2 flex items-center justify-between gap-1 bg-flower-50/50 rounded-lg p-1 border border-flower-100/10">
            <span className="text-[11px] font-mono font-black text-rose-500 px-1.5 py-0.5 select-all">{code}</span>
            <button
              onClick={handleCopy}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all duration-150 flex items-center gap-0.5
                ${copied 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'}`}
            >
              {copied ? (
                <>
                  <span>Đã lưu</span>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <span>Sao chép</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ ĐỒNG HỒ ĐẾM NGƯỢC (Countdown Timer) ============
const CampaignCountdown = ({ endDateStr }: { endDateStr: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!endDateStr) return;
    const targetDate = new Date(endDateStr);
    
    // Nếu chỉ nhập yyyy-MM-dd, đặt hết ngày hôm đó (23:59:59)
    if (endDateStr.length <= 10) {
      targetDate.setHours(23, 59, 59, 999);
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft({ d, h, m, s });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDateStr]);

  if (!timeLeft) return null;

  const padZero = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm text-center select-none">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500 block mb-2">
        ⏳ ƯU ĐÃI SẼ KẾT THÚC SAU
      </span>
      <div className="flex justify-center items-center gap-1.5">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="bg-white text-orange-600 font-extrabold text-sm px-2 py-1 rounded-lg border border-orange-100 min-w-[28px] shadow-sm">
            {padZero(timeLeft.d)}
          </div>
          <span className="text-[8px] text-gray-400 font-bold mt-1">Ngày</span>
        </div>
        <span className="text-orange-400 font-bold text-xs -mt-3">:</span>
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="bg-white text-orange-600 font-extrabold text-sm px-2 py-1 rounded-lg border border-orange-100 min-w-[28px] shadow-sm">
            {padZero(timeLeft.h)}
          </div>
          <span className="text-[8px] text-gray-400 font-bold mt-1">Giờ</span>
        </div>
        <span className="text-orange-400 font-bold text-xs -mt-3">:</span>
        {/* Mins */}
        <div className="flex flex-col items-center">
          <div className="bg-white text-orange-600 font-extrabold text-sm px-2 py-1 rounded-lg border border-orange-100 min-w-[28px] shadow-sm">
            {padZero(timeLeft.m)}
          </div>
          <span className="text-[8px] text-gray-400 font-bold mt-1">Phút</span>
        </div>
        <span className="text-orange-400 font-bold text-xs -mt-3">:</span>
        {/* Secs */}
        <div className="flex flex-col items-center">
          <div className="bg-white text-orange-600 font-extrabold text-sm px-2 py-1 rounded-lg border border-orange-100 min-w-[28px] shadow-sm">
            {padZero(timeLeft.s)}
          </div>
          <span className="text-[8px] text-gray-400 font-bold mt-1">Giây</span>
        </div>
      </div>
    </div>
  );
};

// ============ CAM KẾT CỦA CỬA HÀNG (Trust Commitments) ============
const StoreCommitments = () => {
  const items = [
    { icon: '🚚', title: 'Freeship đơn từ 500K', desc: 'Giao hỏa tốc toàn quốc' },
    { icon: '🛡️', title: '100% Chính hãng', desc: 'Đồ chơi an toàn, chất lượng' },
    { icon: '🔄', title: 'Đổi trả miễn phí 7 ngày', desc: 'Hỗ trợ đổi trả nhanh chóng' }
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="text-lg flex-shrink-0">{item.icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-800 leading-tight">{item.title}</p>
            <p className="text-[9px] text-gray-400 mt-0.5 truncate">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const CampaignPage = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<PromotionResponse[]>([]);
  const [title, setTitle] = useState('Chương trình Khuyến mãi');
  const [banner, setBanner] = useState('/images/banners/1.jpg');
  const [sideBanner, setSideBanner] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productIds, setProductIds] = useState<number[]>([]);

  useEffect(() => {
    campaignApi.get()
      .then(cfg => {
        if (cfg.title) setTitle(cfg.title);
        if (cfg.banner) setBanner(cfg.banner);
        if (cfg.sideBanner) setSideBanner(cfg.sideBanner);
        if (cfg.endDate) setEndDate(cfg.endDate);
        const ids = (cfg.productIds || '').split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
        setProductIds(ids);
      })
      .catch(() => {});
    promotionApi.getAll().then(list => setPromos(list.filter(p => p.isActive))).catch(() => setPromos([]));
  }, []);

  const fetchProducts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      if (productIds.length > 0) {
        const start = (p - 1) * PAGE_SIZE;
        const pageIds = productIds.slice(start, start + PAGE_SIZE);
        const items = await Promise.all(pageIds.map(id => productApi.getById(id).catch(() => null)));
        setProducts(items.filter((x): x is ProductResponse => x !== null));
        setTotalPages(Math.max(1, Math.ceil(productIds.length / PAGE_SIZE)));
      } else {
        const res = await productApi.getAll({ isFeatured: true, page: p, pageSize: PAGE_SIZE });
        setProducts(res.items);
        setTotalPages(res.totalPages || 1);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [productIds]);

  useEffect(() => { fetchProducts(page); }, [page, fetchProducts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-flower-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto rounded-3xl p-1.5"
        style={{ background: 'linear-gradient(90deg,#ec4899,#ef4444,#f59e0b,#ef4444,#ec4899)' }}>
        <div className="rounded-3xl bg-white p-6 sm:p-8 relative overflow-hidden" style={{ border: '2px dashed #f9a8d4' }}>

          {/* Tiêu đề được thiết kế lại đẹp mắt, dùng chung được cho mọi mùa */}
          <div className="text-center mb-8 relative select-none">
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm mb-3">
              <span>🎉 Sự Kiện Đặc Biệt</span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <svg className="w-16 h-3 text-flower-100 opacity-60 hidden sm:block" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M 0 5 Q 12.5 0 25 5 T 50 5 T 75 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              
              <h1 className="text-3xl sm:text-4xl brand-wordmark"
                style={{ background: 'linear-gradient(90deg,#ec4899,#ef4444,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {title}
              </h1>

              <svg className="w-16 h-3 text-flower-100 opacity-60 hidden sm:block" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M 0 5 Q 12.5 0 25 5 T 50 5 T 75 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            
            <svg className="w-24 h-2 text-flower-100 opacity-40 mx-auto mt-2 sm:hidden" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M 0 5 Q 12.5 0 25 5 T 50 5 T 75 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="grid md:grid-cols-4 gap-6 items-start">
            {/* Cột trái: Tự động cuộn dính (sticky scroll) */}
            <div className="md:col-span-1 md:sticky md:top-6 self-start space-y-4">
              {/* Banner chính */}
              <div className="rounded-2xl overflow-hidden shadow-md border-2 border-flower-100 bg-white">
                <img src={getImageUrl(banner)} alt="Chương trình" className="w-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/images/banners/1.jpg'; }} />
              </div>

              {/* Đồng hồ đếm ngược tự động */}
              {endDate && <CampaignCountdown endDateStr={endDate} />}

              {/* Danh sách voucher/khuyến mãi dạng vé xé */}
              {promos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-black text-gray-700 tracking-wider">🎟️ VOUCHER ƯU ĐÃI</span>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {promos.map(pr => (
                      <VoucherTicket key={pr.id} pr={pr} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cam kết cửa hàng */}
              <StoreCommitments />

              {/* Ảnh phụ trang trí do Seller tải lên tùy ý (mùa hè/noel/trung thu...) */}
              {sideBanner && (
                <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
                  <img src={getImageUrl(sideBanner)} alt="Trang trí chiến dịch" className="w-full object-cover" />
                </div>
              )}
            </div>

            {/* Cột phải: Sản phẩm */}
            <div className="md:col-span-3">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-gray-100 rounded-2xl mb-2" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">Chưa có sản phẩm trong chương trình.</div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-8 flex-wrap">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-flower-50">‹</button>
                  {getPageNumbers(page, totalPages).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition
                        ${n === page ? 'bg-flower-100 text-white' : 'border border-gray-200 text-gray-600 hover:bg-flower-50'}`}>
                      {n}
                    </button>
                  ))}
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-flower-50">›</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPage;
