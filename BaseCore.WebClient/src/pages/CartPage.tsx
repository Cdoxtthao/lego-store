import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cartApi';
import { CartResponse } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

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

  const { isAuthenticated, user } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

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
    if (!shippingAddress.trim()) return;
    setCheckoutLoading(true);
    try {
      await cartApi.checkout(shippingAddress, paymentMethod, note);
      setOrderSuccess(true);
      setCart(null);
      refreshCart();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setCheckoutLoading(false);
    }
  };

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
              <div className="grid grid-cols-12 text-xs text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100">
                <div className="col-span-6">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {/* Items */}
              {cart.items.map(item => (
                <div key={item.id}
                  className={`grid grid-cols-12 items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:shadow-sm transition
                    ${updating === item.id ? 'opacity-50' : ''}`}>

                  {/* Ảnh + tên */}
                  <div className="col-span-6 flex items-center gap-3">
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

              {/* Xóa tất cả */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={async () => {
                    await cartApi.clearCart();
                    setCart(null);
                    refreshCart();
                  }}
                  className="text-sm text-gray-400 hover:text-red-500 transition flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa tất cả
                </button>
              </div>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="col-span-1">
              <div className="bg-flower-50 rounded-2xl p-6 sticky top-24">
                <h3 className="font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính ({cart.itemCount} sản phẩm)</span>
                    <span>{cart.total.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className={cart.total >= 500000 ? 'text-green-500 font-medium' : ''}>
                      {cart.total >= 500000 ? 'Miễn phí' : '30.000đ'}
                    </span>
                  </div>
                  {cart.total < 500000 && (
                    <p className="text-xs text-gray-400">
                      Mua thêm {(500000 - cart.total).toLocaleString('vi-VN')}đ để được miễn phí ship
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 mb-5">
                  <div className="flex justify-between font-bold text-gray-800">
                    <span>Tổng cộng</span>
                    <span className="text-flower-100 text-lg">
                      {(cart.total + (cart.total >= 500000 ? 0 : 30000)).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition">
                  Tiến hành thanh toán
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ giao hàng <span className="text-red-500">*</span>
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Nhập địa chỉ giao hàng đầy đủ..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 resize-none"
              />
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
              disabled={!shippingAddress.trim() || checkoutLoading}
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