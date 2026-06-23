import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cartApi';
import { voucherApi, Voucher, MyVoucher } from '../api/voucherApi';
import { CartResponse } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { profileApi } from '../api/profileApi';
import { addressApi, AddressResponse } from '../api/addressApi';

// ===== Tùy chọn gói quà & thiệp =====
const GIFT_OPTIONS = [
  { label: 'Không gói', sub: 'Miễn phí', fee: 0, icon: '📦' },
  { label: 'Cơ bản', sub: '+15.000đ', fee: 15000, icon: '🎀' },
  { label: 'Cao cấp', sub: '+30.000đ', fee: 30000, icon: '🎁' },
  { label: 'Sang trọng', sub: '+50.000đ', fee: 50000, icon: '✨' },
];
const OCCASIONS = [
  { label: 'Sinh nhật', icon: '🎂' },
  { label: 'Tết', icon: '🧧' },
  { label: 'Giáng sinh', icon: '🎄' },
  { label: 'Kỷ niệm', icon: '💐' },
  { label: 'Tốt nghiệp', icon: '🎓' },
  { label: 'Khác', icon: '💝' },
];
const CARD_SUGGESTIONS = [
  'Gửi đến bạn với tất cả tình yêu thương! 💝 Chúc bạn luôn vui vẻ, mạnh khỏe và hạnh phúc mỗi ngày!',
  'Chúc mừng! 🎉 Mong những điều tuyệt vời nhất sẽ đến với bạn.',
  'Một món quà nhỏ thay lời chúc lớn — vạn sự như ý! 🌸',
];

const CartPage = () => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // ===== Gói quà & thiệp chúc mừng =====
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [giftType, setGiftType] = useState(0);        // index trong GIFT_OPTIONS
  const [occasion, setOccasion] = useState('Khác');
  const [recipient, setRecipient] = useState('');
  const [sender, setSender] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [showCardPreview, setShowCardPreview] = useState(false);

  // ===== Mã giảm giá =====
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [showVoucherDropdown, setShowVoucherDropdown] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { refreshCart } = useCart();
  const { pushNotification } = useNotifications();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (cart?.items) {
      setSelectedItems(cart.items.map(item => item.id));
    }
  }, [cart]);

  const selectedTotal = cart?.items
  .filter(item => selectedItems.includes(item.id))
  .reduce((sum, item) => sum + item.subtotal, 0) ?? 0;

  const selectedCount = selectedItems.length;

  const isAllSelected = cart?.items.length === selectedItems.length;

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedItems([]);
    else setSelectedItems(cart?.items.map(i => i.id) ?? []);
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (showCheckout) {
      addressApi.getAll().then(res => {
        setAddresses(res);
        const def = res.find(a => a.isDefault);
        if (def) setSelectedAddressId(def.id);
      }).catch(() => {});

      // Lấy danh sách mã giảm giá khả dụng
      Promise.all([
        voucherApi.getActive().catch(() => [] as Voucher[]),
        voucherApi.getMine().catch(() => [] as MyVoucher[])
      ]).then(([actives, mine]) => {
        const uniqueVouchersMap = new Map<string, Voucher>();
        // Lấy danh sách các mã đã sử dụng của người dùng
        const usedCodes = new Set(mine.filter(mv => mv.isUsed).map(mv => mv.voucher.code));

        // Ưu tiên các mã giảm giá công khai của cửa hàng (chưa sử dụng)
        actives.forEach(v => {
          if (v.isActive && !usedCodes.has(v.code)) {
            uniqueVouchersMap.set(v.code, v);
          }
        });
        // Ghép các mã giảm giá cá nhân chưa sử dụng của người dùng
        mine.forEach(mv => {
          if (!mv.isUsed && mv.voucher.isActive) {
            uniqueVouchersMap.set(mv.voucher.code, mv.voucher);
          }
        });
        setAvailableVouchers(Array.from(uniqueVouchersMap.values()));
      }).catch(() => {});
    }
  }, [showCheckout]);

  // Tự động tính toán lại / hủy bỏ mã giảm giá khi giỏ hàng hoặc các sản phẩm được chọn thay đổi
  useEffect(() => {
    if (appliedVoucher) {
      const reapply = async () => {
        if (selectedItems.length === 0) {
          setAppliedVoucher(null);
          setVoucherMsg(null);
          return;
        }
        try {
          const res = await voucherApi.apply(appliedVoucher.code, selectedItems);
          if (res.valid) {
            setAppliedVoucher({ code: appliedVoucher.code, discount: res.discount });
          } else {
            setAppliedVoucher(null);
            setVoucherMsg({ ok: false, text: 'Mã không còn áp dụng cho các sản phẩm đã chọn.' });
          }
        } catch {
          setAppliedVoucher(null);
          setVoucherMsg(null);
        }
      };
      reapply();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItems, cart]);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const res = await cartApi.getCart();
      setCart(res);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(cartItemId);
    try {
      const res = await cartApi.updateQuantity(cartItemId, quantity);
      setCart(res);
      refreshCart();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật số lượng');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    setUpdating(cartItemId);
    try {
      const res = await cartApi.removeItem(cartItemId);
      setCart(res);
      refreshCart();
    } finally {
      setUpdating(null);
    }
  };

  const applyVoucher = async () => {
    const code = voucherInput.trim();
    if (!code) return;
    if (selectedItems.length === 0) { setVoucherMsg({ ok: false, text: 'Hãy chọn sản phẩm trước.' }); return; }
    try {
      const res = await voucherApi.apply(code, selectedItems);
      if (res.valid) {
        setAppliedVoucher({ code, discount: res.discount });
        setVoucherMsg({ ok: true, text: res.message });
      } else {
        setAppliedVoucher(null);
        setVoucherMsg({ ok: false, text: res.message });
      }
    } catch (err: any) {
      setAppliedVoucher(null);
      setVoucherMsg({ ok: false, text: err.response?.data?.message || 'Không áp dụng được mã.' });
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }
    setCheckoutLoading(true);
    try {
      const giftFee = giftEnabled ? GIFT_OPTIONS[giftType].fee : 0;
      const shippingFee = selectedTotal >= 500000 ? 0 : 30000;
      const voucherDiscount = appliedVoucher?.discount ?? 0;
      const total = Math.max(0, selectedTotal + shippingFee + giftFee - voucherDiscount);
      setOrderTotal(total);

      // Ghi chú gói quà để seller thấy (có hộp + lời chúc)
      let giftNote: string | undefined;
      if (giftEnabled && (giftFee > 0 || cardMessage.trim())) {
        const opt = GIFT_OPTIONS[giftType];
        const lines = [`🎁 Gói quà: ${opt.label}${opt.fee > 0 ? ` (+${opt.fee.toLocaleString('vi-VN')}đ)` : ''} · Dịp: ${occasion}`];
        if (recipient.trim() || sender.trim())
          lines.push(`Người nhận: ${recipient.trim() || '-'} | Người gửi: ${sender.trim() || '-'}`);
        if (cardMessage.trim()) lines.push(`Lời chúc: ${cardMessage.trim()}`);
        giftNote = lines.join('\n');
      }

      const res = await cartApi.checkout(
        selectedAddress.fullAddress,
        paymentMethod,
        selectedItems,
        note,
        giftFee,
        giftNote,
        shippingFee,
        appliedVoucher?.code
      );
      setCart(null);
      refreshCart();
      setShowCheckout(false);
      // Thông báo đặt hàng thành công
      pushNotification({
        type: 'order',
        orderId: res.id,
        status: 'Pending',
        title: 'Đặt hàng thành công',
        message: `Đơn hàng #${res.id} của bạn đã được tạo và đang chờ xác nhận.`,
      });
      if (paymentMethod === 'COD') {
        setOrderSuccess(true);
      } else {
        // MoMo/ZaloPay → hiện QR
        setOrderId(res.id);
        setShowQR(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (showQR) return (
    <div className="min-h-screen bg-flower-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-sm w-full">

        {/* Header */}
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl
          ${paymentMethod === 'MoMo' ? 'bg-pink-100' : 'bg-blue-100'}`}>
          {paymentMethod === 'MoMo' ? '💜' : '💙'}
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Thanh toán {paymentMethod}
        </h2>
        <p className="text-sm text-gray-500 mb-2">
          Đơn hàng #{orderId}
        </p>
        <p className="text-2xl font-bold text-flower-100 mb-6">
          {orderTotal.toLocaleString('vi-VN')}đ
        </p>

        {/* QR Code */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 mb-4">
          <img
            src={`https://localhost:7175/images/payment/${paymentMethod === 'MoMo' ? 'momo-qr' : 'zalopay-qr'}.jpg`}
            alt={`QR ${paymentMethod}`}
            className="w-48 h-48 mx-auto object-cover"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.style.display = 'none';
            }}
          />
          <p className="text-xs text-gray-400 mt-2">
            Quét mã QR để thanh toán
          </p>
        </div>

        {/* Hướng dẫn */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-semibold text-gray-700 mb-2">Hướng dẫn:</p>
          {paymentMethod === 'MoMo' ? (
            <>
              <p className="text-xs text-gray-500">1. Mở app MoMo</p>
              <p className="text-xs text-gray-500">2. Chọn "Quét mã QR"</p>
              <p className="text-xs text-gray-500">3. Quét mã và xác nhận thanh toán</p>
              <p className="text-xs text-gray-500">4. Nhập nội dung: <span className="font-medium text-gray-700">DH{orderId}</span></p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">1. Mở app ZaloPay</p>
              <p className="text-xs text-gray-500">2. Chọn "Quét mã QR"</p>
              <p className="text-xs text-gray-500">3. Quét mã và xác nhận thanh toán</p>
              <p className="text-xs text-gray-500">4. Nhập nội dung: <span className="font-medium text-gray-700">DH{orderId}</span></p>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              setShowQR(false);
              setOrderSuccess(true);
            }}
            className="w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition">
            Tôi đã thanh toán xong ✓
          </button>
          <button
            onClick={() => {
              setShowQR(false);
              setOrderSuccess(true);
            }}
            className="w-full py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition">
            Thanh toán sau (COD)
          </button>
        </div>

        {/* Lưu ý */}
        <p className="text-xs text-gray-400 mt-4">
          Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán
        </p>
            
        
      </div>
    </div>
  );

  // Đặt hàng thành công
  if (orderSuccess) return (
    <div className="min-h-screen bg-flower-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-12 text-center shadow-lg max-w-md">
        <span className="text-6xl mb-4 block">🎉</span>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h2>
        <p className="text-gray-500 mb-6">
          Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/"
            className="px-6 py-2.5 bg-flower-100 text-white rounded-full font-medium hover:bg-flower-150 transition">
            Về trang chủ
          </Link>
          <Link to="/products"
            className="px-6 py-2.5 border border-flower-100 text-flower-100 rounded-full font-medium hover:bg-flower-50 transition">
            Tiếp tục mua
          </Link>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-48 mb-8" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          🛒 Giỏ hàng {!isEmpty && `(${cart.items.length} sản phẩm)`}
        </h1>

        {isEmpty ? (
          // Giỏ hàng trống
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-8xl mb-6">🛒</span>
            <p className="text-xl font-medium mb-2 text-gray-600">Giỏ hàng trống</p>
            <p className="text-sm mb-6">Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
            <Link to="/products"
              className="px-8 py-3 bg-flower-100 text-white rounded-full font-medium hover:bg-flower-150 transition">
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">

            {/* Danh sách sản phẩm */}
            <div className="col-span-2 space-y-4">

              {/* Header */}
              <div className="grid grid-cols-12 text-xs text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100 items-center">
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-flower-100 cursor-pointer"
                  />
                </div>
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {/* Items */}
              {cart.items.map(item => (
                <div key={item.id}
                  className={`grid grid-cols-12 items-center gap-4 p-4 rounded-2xl border transition
                    ${updating === item.id ? 'opacity-50' : ''}
                    ${selectedItems.includes(item.id)
                      ? 'border-flower-100 bg-flower-50'
                      : 'border-gray-100 hover:shadow-sm'}`}>

                   <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-4 h-4 accent-flower-100 cursor-pointer"
                    />
                  </div>

                  {/* Ảnh + tên */}
                  <div className="col-span-5 flex items-center gap-3">
                    <Link to={`/products/${item.productId}`}
                      className="w-20 h-20 flex-shrink-0 bg-flower-50 rounded-xl overflow-hidden">
                      <img
                        src={getImageUrl(item.productImage)}
                        alt={item.productName}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.productId}`}
                        className="text-sm font-medium text-gray-800 hover:text-flower-100 transition line-clamp-2">
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition mt-1 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Đơn giá */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-flower-100 font-medium">
                      {item.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {/* Số lượng */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating === item.id}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-flower-50 transition text-sm disabled:opacity-30">
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-flower-50 transition text-sm">
                        +
                      </button>
                    </div>
                  </div>

                  {/* Thành tiền */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-flower-100">
                      {item.subtotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              ))}

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    {/* Chọn tất cả */}
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 accent-flower-100"
                      />
                      Chọn tất cả ({cart.items.length})
                    </label>

                    {/* Xóa các sản phẩm đã chọn */}
                    {selectedItems.length > 0 && (
                      <button
                        onClick={async () => {
                          for (const id of selectedItems) {
                            await cartApi.removeItem(id);
                          }
                          fetchCart();
                          setSelectedItems([]);
                          refreshCart();
                        }}
                        className="text-sm text-red-500 hover:text-red-600 transition flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa đã chọn ({selectedItems.length})
                      </button>
                    )}
                  </div>

                  {/* Xóa tất cả */}
                  <button
                    onClick={async () => {
                      await cartApi.clearCart();
                      setCart(null);
                      setSelectedItems([]);
                      refreshCart();
                    }}
                    className="text-sm text-gray-400 hover:text-red-500 transition flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa tất cả
                  </button>
                </div>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="col-span-1">
              <div className="bg-flower-50 rounded-2xl p-6 sticky top-24">
                <h3 className="font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h3>

                {/* Số sản phẩm đã chọn */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  Tổng cộng:
                  <span className="w-5 h-5 bg-flower-100 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {selectedCount}
                  </span>
                  sản phẩm được chọn
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính</span>
                    <span>{selectedTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className={selectedTotal >= 500000 ? 'text-green-500 font-medium' : ''}>
                      {selectedTotal >= 500000 ? 'Miễn phí' : '30.000đ'}
                    </span>
                  </div>
                  {selectedTotal > 0 && selectedTotal < 500000 && (
                    <p className="text-xs text-gray-400">
                      Mua thêm {(500000 - selectedTotal).toLocaleString('vi-VN')}đ để được miễn phí ship
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 mb-5">
                  <div className="flex justify-between font-bold text-gray-800">
                    <span>Tổng cộng</span>
                    <span className="text-flower-100 text-lg">
                      {(selectedTotal + (selectedTotal >= 500000 ? 0 : 30000)).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedItems.length === 0) {
                      alert('Vui lòng chọn ít nhất 1 sản phẩm');
                      return;
                    }
                    setShowCheckout(true);
                  }}
                  disabled={selectedItems.length === 0}
                  className="w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition disabled:opacity-40">
                  Tiến hành thanh toán ({selectedCount})
                </button>

                <Link to="/products"
                  className="block text-center text-sm text-flower-100 hover:underline mt-3">
                  ← Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal thanh toán */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCheckout(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Thông tin thanh toán</h3>
              <button onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Địa chỉ giao hàng */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </label>
                <Link to="/profile"
                  onClick={() => setShowCheckout(false)}
                  className="text-xs text-flower-100 hover:underline">
                  + Thêm địa chỉ mới
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="p-4 bg-yellow-50 rounded-xl text-center">
                  <p className="text-sm text-yellow-700 mb-2">Bạn chưa có địa chỉ giao hàng</p>
                  <Link to="/profile"
                    onClick={() => setShowCheckout(false)}
                    className="text-sm text-flower-100 font-medium hover:underline">
                    Thêm địa chỉ ngay →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition
                        ${selectedAddressId === addr.id
                          ? 'border-flower-100 bg-flower-50'
                          : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
                        ${selectedAddressId === addr.id ? 'border-flower-100' : 'border-gray-300'}`}>
                        {selectedAddressId === addr.id && (
                          <div className="w-2 h-2 bg-flower-100 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">{addr.receiverName}</p>
                          <span className="text-gray-300">|</span>
                          <p className="text-xs text-gray-500">{addr.phoneNumber}</p>
                          {addr.isDefault && (
                            <span className="text-xs bg-flower-100 text-white px-1.5 py-0.5 rounded-full">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{addr.fullAddress}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'COD', label: '💵 COD' },
                  { value: 'MoMo', label: '💜 MoMo' },
                  { value: 'ZaloPay', label: '💙 ZaloPay' },
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition
                      ${paymentMethod === method.value
                        ? 'border-flower-100 bg-flower-50 text-flower-100'
                        : 'border-gray-200 text-gray-600 hover:border-flower-100'}`}>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (không bắt buộc)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho đơn hàng..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
              />
            </div>

            {/* Gói quà & thiệp chúc mừng */}
            <div className="mb-5 rounded-2xl border border-flower-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-flower-50">
                <span className="text-sm font-semibold text-gray-700">🎁 Gói quà & Thiệp chúc mừng</span>
                <button type="button" onClick={() => setGiftEnabled(v => !v)}
                  className={`w-11 h-6 rounded-full transition relative ${giftEnabled ? 'bg-flower-100' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${giftEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {giftEnabled && (
                <div className="p-4 space-y-4 bg-flower-50/40">
                  {/* Kiểu gói quà */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Kiểu gói quà</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {GIFT_OPTIONS.map((g, i) => (
                        <button key={g.label} type="button" onClick={() => setGiftType(i)}
                          className={`rounded-xl border p-2 text-center transition ${giftType === i ? 'border-flower-100 bg-white shadow-sm' : 'border-gray-200 bg-white/60 hover:border-flower-100'}`}>
                          <div className="text-xl">{g.icon}</div>
                          <div className="text-xs font-semibold text-gray-700 mt-1">{g.label}</div>
                          <div className={`text-[11px] ${g.fee > 0 ? 'text-flower-100' : 'text-green-600'}`}>{g.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dịp đặc biệt */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Dịp đặc biệt</p>
                    <div className="flex flex-wrap gap-1.5">
                      {OCCASIONS.map(o => (
                        <button key={o.label} type="button" onClick={() => setOccasion(o.label)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${occasion === o.label ? 'bg-flower-100 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                          {o.icon} {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Người nhận / gửi */}
                  <div className="grid grid-cols-2 gap-2">
                    <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Tên người nhận"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={sender} onChange={e => setSender(e.target.value)} placeholder="Tên người gửi"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>

                  {/* Lời chúc */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-500">Lời chúc</p>
                      <button type="button"
                        onClick={() => setCardMessage(CARD_SUGGESTIONS[Math.floor(Math.random() * CARD_SUGGESTIONS.length)])}
                        className="text-xs text-flower-100 border border-flower-100 rounded-full px-2 py-0.5">✨ Gợi ý</button>
                    </div>
                    <textarea value={cardMessage} onChange={e => setCardMessage(e.target.value.slice(0, 200))} rows={2}
                      placeholder="Viết lời chúc của bạn..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-gray-400">{cardMessage.length}/200</span>
                      {cardMessage.trim() && (
                        <button type="button" onClick={() => setShowCardPreview(true)}
                          className="text-xs text-flower-100">👁 Xem trước thiệp</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mã giảm giá */}
            <div className="mb-5 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Mã giảm giá</label>
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <input
                    value={voucherInput}
                    onChange={(e) => { setVoucherInput(e.target.value); setVoucherMsg(null); }}
                    onFocus={() => setShowVoucherDropdown(true)}
                    placeholder="Nhập hoặc chọn mã giảm giá..."
                    className="w-full border border-gray-200 rounded-xl p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100" />
                  
                  {/* Icon toggle dropdown */}
                  <button
                    type="button"
                    onClick={() => setShowVoucherDropdown(!showVoucherDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className={`h-4 w-4 transition-transform ${showVoucherDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {appliedVoucher ? (
                  <button onClick={() => { setAppliedVoucher(null); setVoucherInput(''); setVoucherMsg(null); }}
                    className="px-4 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition">Bỏ</button>
                ) : (
                  <button onClick={applyVoucher}
                    className="px-5 rounded-xl bg-flower-100 text-white text-sm font-semibold hover:bg-flower-150 transition">Áp dụng</button>
                )}
              </div>

              {/* Dropdown combo box */}
              {showVoucherDropdown && (
                <>
                  {/* Overlay click-out */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowVoucherDropdown(false)} />
                  
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {availableVouchers.filter(v => v.code.toLowerCase().includes(voucherInput.toLowerCase())).length === 0 ? (
                      <div className="p-3 text-xs text-gray-400 text-center">Không có mã giảm giá khả dụng</div>
                    ) : (
                      availableVouchers.filter(v => v.code.toLowerCase().includes(voucherInput.toLowerCase())).map(v => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setVoucherInput(v.code);
                            setVoucherMsg(null);
                            setShowVoucherDropdown(false);
                          }}
                          className="p-3 hover:bg-flower-50/50 cursor-pointer transition text-left">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-gray-800 bg-flower-50 text-flower-100 px-2 py-0.5 rounded-lg border border-flower-100/30">{v.code}</span>
                            <span className="text-xs font-bold text-red-500">Giảm {v.discountPercent}%</span>
                          </div>
                          {v.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{v.description}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {voucherMsg && (
                <p className={`text-xs mt-1 ${voucherMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{voucherMsg.text}</p>
              )}
            </div>

            {/* Tổng tiền */}
            <div className="bg-flower-50 rounded-xl p-4 mb-5 space-y-1">
              {giftEnabled && GIFT_OPTIONS[giftType].fee > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>🎁 Gói quà ({GIFT_OPTIONS[giftType].label})</span>
                  <span>+{GIFT_OPTIONS[giftType].fee.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {appliedVoucher && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>🏷️ Mã {appliedVoucher.code}</span>
                  <span>−{appliedVoucher.discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800">
                <span>Tổng thanh toán</span>
                <span className="text-flower-100 text-lg">
                  {Math.max(0, selectedTotal + (selectedTotal >= 500000 ? 0 : 30000) + (giftEnabled ? GIFT_OPTIONS[giftType].fee : 0) - (appliedVoucher?.discount ?? 0)).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={!selectedAddress || checkoutLoading}
              className="w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition disabled:opacity-40">
              {checkoutLoading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
          </div>
        </div>
      )}

      {/* Xem trước thiệp */}
      {showCardPreview && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowCardPreview(false)}>
          <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="rounded-2xl p-6 text-white text-center shadow-xl"
              style={{ background: 'linear-gradient(135deg,#f472b6,#ec4899)' }}>
              <div className="text-4xl mb-3">💝</div>
              <p className="whitespace-pre-wrap leading-relaxed">{cardMessage}</p>
              {(recipient || sender) && (
                <div className="mt-3 text-sm opacity-90">
                  {recipient && <p>Gửi: {recipient}</p>}
                  {sender && <p>Từ: {sender}</p>}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-white/30 text-sm font-semibold">🎁 3TL-Store Gift</div>
            </div>
            <button onClick={() => setShowCardPreview(false)}
              className="w-full mt-3 py-2.5 bg-white rounded-xl font-medium text-gray-600">Đóng xem trước</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;