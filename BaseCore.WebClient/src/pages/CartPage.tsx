import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cartApi';
import { CartResponse } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { profileApi } from '../api/profileApi';
import { addressApi, AddressResponse } from '../api/addressApi';

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

  const { isAuthenticated, user } = useAuth();
  const { refreshCart } = useCart();
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
    }
  }, [showCheckout]);

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
      const total = cart!.total + (cart!.total >= 500000 ? 0 : 30000);
      setOrderTotal(total);

      const res = await cartApi.checkout(
        selectedAddress.fullAddress,
        paymentMethod,
        selectedItems,
        note
      );
      setCart(null);
      refreshCart();
      setShowCheckout(false);
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
          🛒 Giỏ hàng {!isEmpty && `(${cart.itemCount} sản phẩm)`}
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
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

            {/* Tổng tiền */}
            <div className="bg-flower-50 rounded-xl p-4 mb-5">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Tổng thanh toán</span>
                <span className="text-flower-100 text-lg">
                  {(cart!.total + (cart!.total >= 500000 ? 0 : 30000)).toLocaleString('vi-VN')}đ
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
    </div>
  );
};

export default CartPage;