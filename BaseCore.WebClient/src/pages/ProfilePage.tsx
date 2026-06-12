import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileApi } from '../api/profileApi';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { addressApi, AddressResponse } from '../api/addressApi';
import { orderApi } from '../api/orderApi';
import { reviewApi } from '../api/reviewApi';
import { cartApi } from '../api/cartApi';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import * as signalR from '@microsoft/signalr';

const ProfilePage = ({ initialTab = 'info' }: { initialTab?: 'info' | 'password' | 'orders' }) => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'address' | 'password' | 'orders'>(initialTab);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=1')
      .then(r => r.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (profile?.address) {
      setForm(prev => ({ ...prev, address: profile.address }));
    }
  }, [profile]);

  const handleProvinceChange = async (code: string) => {
    setProvince(code);
    setDistrict('');
    setWard('');
    setWards([]);
    if (!code) { setDistricts([]); return; }
    const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
    const data = await res.json();
    setDistricts(data.districts || []);
  };

  const handleDistrictChange = async (code: string) => {
    setDistrict(code);
    setWard('');
    if (!code) { setWards([]); return; }
    const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
    const data = await res.json();
    setWards(data.wards || []);
  };

  useEffect(() => {
    if (!province) return;
    const provinceName = provinces.find(p => p.code === Number(province))?.name || '';
    const districtName = districts.find(d => d.code === Number(district))?.name || '';
    const wardName = wards.find(w => w.code === Number(ward))?.name || '';

    const parts = [streetAddress, wardName, districtName, provinceName].filter(Boolean);
    if (parts.length > 0) {
      setForm(prev => ({ ...prev, address: parts.join(', ') }));
    }
  }, [province, district, ward, streetAddress]);

  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);

  // Info form
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    // address: '',
    avatarUrl: '',
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  // Password form
  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPw, setSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState({
    old: false, new: false, confirm: false,
  });

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.getMe();
      setProfile(res);
      setForm({
        fullName: res.fullName || '',
        phoneNumber: res.phoneNumber || '',
        // address: res.address || '',
        avatarUrl: res.avatarUrl || '',
      });
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append('file', compressed, file.name);

      const res = await axiosClient.post('/Image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAvatarUrl = res.data.url;
      setForm(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      await profileApi.updateMe({ avatarUrl: newAvatarUrl });
      const updatedUser = { ...user!, avatarUrl: newAvatarUrl };
      login(updatedUser);

    } catch {
      setInfoError('Upload ảnh thất bại');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setInfoError('');
    try {
      await profileApi.updateMe(form);
      setInfoSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => setInfoSuccess(''), 3000);
      fetchProfile();
    } catch (err: any) {
      setInfoError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('Vui lòng điền đầy đủ thông tin'); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp'); return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return;
    }

    setSavingPw(true);
    try {
      await profileApi.changePassword(pwForm);
      setPwSuccess('Đổi mật khẩu thành công!');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
      <div className="grid grid-cols-3 gap-8">
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="col-span-2 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );

  const avatarUrl = form.avatarUrl
    ? (form.avatarUrl.startsWith('http')
        ? form.avatarUrl
        : `https://localhost:7175${form.avatarUrl}`)
    : null;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-flower-100">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-600">Tài khoản của tôi</span>
        </nav>

        <div className="grid grid-cols-3 gap-6">

          {/* Sidebar trái */}
          <div className="col-span-1 space-y-4">

            {/* Avatar card */}
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-flower-100 mx-auto bg-flower-50">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profile?.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-flower-100">
                      {profile?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Nút upload avatar */}
                <label
                  htmlFor="avatarUpload"
                  className="absolute bottom-0 right-0 w-7 h-7 bg-flower-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-flower-150 transition shadow-md">
                  {uploadingAvatar ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </label>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                  className="hidden"
                />
              </div>

              <h3 className="font-bold text-gray-800 text-lg">{profile?.fullName}</h3>
              <p className="text-sm text-gray-400 mb-3">{profile?.email}</p>
              <span className="inline-block bg-flower-50 text-flower-100 text-xs font-semibold px-3 py-1 rounded-full">
                {profile?.roleName}
              </span>

              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                Thành viên từ {new Date(profile?.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>

            {/* Menu */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { key: 'info', label: 'Thông tin cá nhân', icon: '👤' },
                { key: 'address', label: 'Địa chỉ của tôi', icon: '📍' },
                { key: 'password', label: 'Đổi mật khẩu', icon: '🔒' },
                { key: 'orders', label: 'Đơn hàng của tôi', icon: '📦' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition border-b border-gray-50 last:border-0
                    ${activeTab === tab.key
                      ? 'bg-flower-50 text-flower-100 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'}`}>
                  <span>{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.key && (
                    <svg className="h-4 w-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung phải */}
          <div className="col-span-2">

            {/* Tab địa chỉ */}
            {activeTab === 'address' && <AddressTab />}

            {/* Tab thông tin cá nhân */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Thông tin cá nhân</h2>

                <div className="space-y-4">
                  {/* Họ tên */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    />
                  </div>

                  {/* Email — readonly */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="0912345678"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    />
                  </div>
                </div>

                {infoSuccess && (
                  <div className="mt-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2">
                    <span>✅</span> {infoSuccess}
                  </div>
                )}
                {infoError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-xl text-sm">
                    {infoError}
                  </div>
                )}

                <button
                  onClick={handleSaveInfo}
                  disabled={savingInfo}
                  className="mt-6 w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition disabled:opacity-50">
                  {savingInfo ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            )}

            {/* Tab đổi mật khẩu */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Đổi mật khẩu</h2>

                <div className="space-y-4">
                  {/* Mật khẩu cũ */}
                  {[
                    { key: 'old', label: 'Mật khẩu hiện tại', field: 'oldPassword', placeholder: '••••••' },
                    { key: 'new', label: 'Mật khẩu mới', field: 'newPassword', placeholder: 'Ít nhất 6 ký tự' },
                    { key: 'confirm', label: 'Xác nhận mật khẩu mới', field: 'confirmPassword', placeholder: 'Nhập lại mật khẩu mới' },
                  ].map(item => (
                    <div key={item.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {item.label}
                      </label>
                      <div className="relative">
                        <input
                          type={showPw[item.key as keyof typeof showPw] ? 'text' : 'password'}
                          value={pwForm[item.field as keyof typeof pwForm]}
                          onChange={(e) => setPwForm({ ...pwForm, [item.field]: e.target.value })}
                          placeholder={item.placeholder}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(prev => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof showPw]
                          }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPw[item.key as keyof typeof showPw] ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Strength indicator cho mật khẩu mới */}
                      {item.key === 'new' && pwForm.newPassword && (
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map(level => (
                              <div key={level}
                                className={`h-1 flex-1 rounded-full transition
                                  ${pwForm.newPassword.length >= level * 2
                                    ? level <= 1 ? 'bg-red-400'
                                    : level <= 2 ? 'bg-yellow-400'
                                    : level <= 3 ? 'bg-blue-400'
                                    : 'bg-green-400'
                                    : 'bg-gray-200'}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {pwForm.newPassword.length < 6 ? 'Quá ngắn'
                              : pwForm.newPassword.length < 8 ? 'Yếu'
                              : pwForm.newPassword.length < 10 ? 'Trung bình'
                              : 'Mạnh'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {pwSuccess && (
                  <div className="mt-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2">
                    <span>✅</span> {pwSuccess}
                  </div>
                )}
                {pwError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-xl text-sm">
                    {pwError}
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={savingPw}
                  className="mt-6 w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition disabled:opacity-50">
                  {savingPw ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </button>
              </div>
            )}

            {/* Tab đơn hàng */}
            {activeTab === 'orders' && (
              <OrdersTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== ORDERS TAB ==========
const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [receivingId, setReceivingId] = useState<number | null>(null);
  const [confirmReceiveId, setConfirmReceiveId] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [reviewedOrders, setReviewedOrders] = useState<number[]>([]);
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/Orders/my');
      setOrders(res.data);

      const reviewed: number[] = [];
      for (const order of res.data) {
        if (order.status === 'Delivered' && order.items?.length > 0) {
          // Sử dụng thuộc tính isReviewed do backend tính toán và trả về trực tiếp
          if (order.items.every((item: any) => item.isReviewed)) {
            reviewed.push(order.id);
          }
        }
      }
      setReviewedOrders(reviewed);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Kết nối SignalR để tự động cập nhật trạng thái đơn hàng khi admin xử lý
    const token = localStorage.getItem('token');
    if (!token) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7175/hubs/chat', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveOrderStatusUpdate', (data: any) => {
      fetchOrders();
    });

    connection.start().catch(err => console.error('SignalR in User Orders:', err));

    return () => { connection.stop(); };
  }, []);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await orderApi.cancelOrder(id);
      setConfirmCancelId(null);
      fetchOrders(); // reload
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReceive = async (id: number) => {
    setReceivingId(id);
    try {
      await orderApi.receiveOrder(id);
      setConfirmReceiveId(null);
      fetchOrders(); // reload
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setReceivingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    Pending:   'bg-yellow-50 text-yellow-600',
    Confirmed: 'bg-purple-50 text-purple-600',
    Shipping:  'bg-purple-50 text-purple-600',
    Delivered: 'bg-green-50 text-green-600',
    Cancelled: 'bg-red-50 text-red-600',
  };

  const statusLabels: Record<string, string> = {
    Pending:   '⏳ Chờ xác nhận',
    Confirmed: '🚚 Đang giao',
    Shipping:  '🚚 Đang giao',
    Delivered: '🎉 Đã giao',
    Cancelled: '❌ Đã hủy',
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-6">Đơn hàng của tôi</h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-5xl mb-4">📦</span>
          <p className="font-medium text-gray-600 mb-2">Chưa có đơn hàng nào</p>
          <p className="text-sm mb-4">Hãy mua sắm và đặt hàng ngay!</p>
          <Link to="/products"
            className="px-6 py-2.5 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id}
              className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">

              {/* Header đơn hàng */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-flower-100">#{order.id}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                    ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              {/* Sản phẩm */}
              <div className="space-y-2 mb-3">
                {order.items?.slice(0, 2).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 bg-flower-50 rounded-lg overflow-hidden">
                      <img
                        src={item.productImage
                          ? `https://localhost:7175${item.productImage}`
                          : ''}
                        alt={item.productName}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-gray-400">
                        x{item.quantity} · {item.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                ))}
                {order.items?.length > 2 && (
                  <p className="text-xs text-gray-400 pl-15">
                    +{order.items.length - 2} sản phẩm khác
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-right flex-1">
                  <p className="text-xs text-gray-400">Tổng tiền</p>
                  <p className="font-bold text-flower-100">
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </p>
                </div>

              <div className="flex gap-2 ml-4">

                {/* Đang giao -> hiện nút Đã nhận hàng */}
                {(order.status === 'Shipping' || order.status === 'Confirmed') && (
                  <button
                    onClick={() => setConfirmReceiveId(order.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition flex items-center gap-1 shadow-sm">
                    📦 Đã nhận hàng
                  </button>
                )}

                {/* Đơn đã giao -> hiện cả Mua lại và Đánh giá */}
                {order.status === 'Delivered' && (
                  <>
                    <button
                      onClick={async () => {
                        for (const item of order.items || []) {
                          await cartApi.addToCart(item.productId, item.quantity);
                        }
                        refreshCart();
                        navigate('/cart');
                      }}
                      className="px-4 py-2 bg-flower-100 text-white rounded-xl text-xs font-medium hover:bg-flower-150 transition flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Mua lại
                    </button>

                    {reviewedOrders.includes(order.id) ? (
                      <button
                        disabled
                        className="px-4 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-xl text-xs font-medium cursor-not-allowed">
                        ✓ Đã đánh giá
                      </button>
                    ) : (
                      <button
                        onClick={() => { setReviewOrder(order); setShowReviewModal(true); }}
                        className="px-4 py-2 border border-flower-100 text-flower-100 rounded-xl text-xs font-medium hover:bg-flower-50 transition">
                        ⭐ Đánh giá
                      </button>
                    )}
                  </>
                )}

                {/* Chưa xác nhận (Pending) -> có thể hủy */}
                {order.status === 'Pending' && (
                  <button
                    onClick={() => setConfirmCancelId(order.id)}
                    className="px-4 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition">
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {confirmCancelId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <span className="text-4xl block mb-3">⚠️</span>
              <h3 className="font-bold text-gray-800 text-lg">Xác nhận hủy đơn</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bạn có chắc muốn hủy đơn hàng #{confirmCancelId}?
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Hành động này không thể hoàn tác
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Giữ đơn
              </button>
              <button
                onClick={() => handleCancel(confirmCancelId)}
                disabled={cancellingId === confirmCancelId}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
                {cancellingId === confirmCancelId ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReceiveId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <span className="text-4xl block mb-3">📦</span>
              <h3 className="font-bold text-gray-800 text-lg">Đã nhận được hàng?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bạn xác nhận đã nhận được đơn hàng #{confirmReceiveId} đầy đủ và nguyên vẹn?
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Trạng thái đơn hàng sẽ chuyển thành Đã giao ở cả admin và user, giao dịch sẽ hoàn tất và không thể chuyển trạng thái được nữa.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReceiveId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Chưa nhận
              </button>
              <button
                onClick={() => handleReceive(confirmReceiveId)}
                disabled={receivingId === confirmReceiveId}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition disabled:opacity-50">
                {receivingId === confirmReceiveId ? 'Đang xác nhận...' : 'Xác nhận đã nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && reviewOrder && (
        <ReviewOrderModal
          order={reviewOrder}
          onClose={() => {
            setShowReviewModal(false);
            fetchOrders();
          }}
          onSaved={() => {
            setShowReviewModal(false);
            fetchOrders();
          }}
          onAllReviewed={() => {
            setReviewedOrders(prev => [...prev, reviewOrder.id]);
          }}
        />
      )}

    </div>
  );
};

const AddressTab = () => {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAddress, setEditAddress] = useState<AddressResponse | null>(null);

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressApi.getAll();
      setAddresses(res);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await addressApi.delete(id);
    fetchAddresses();
  };

  const handleSetDefault = async (id: number) => {
    await addressApi.setDefault(id);
    fetchAddresses();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">📍 Địa chỉ của tôi</h2>
        <button
          onClick={() => { setEditAddress(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm địa chỉ
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <span className="text-5xl mb-3">📍</span>
          <p className="font-medium text-gray-600 mb-1">Chưa có địa chỉ nào</p>
          <p className="text-sm mb-4">Thêm địa chỉ để thanh toán nhanh hơn</p>
          <button
            onClick={() => { setEditAddress(null); setShowModal(true); }}
            className="px-6 py-2.5 bg-flower-100 text-white rounded-full text-sm hover:bg-flower-150 transition">
            Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id}
              className={`border-2 rounded-xl p-4 transition
                ${addr.isDefault ? 'border-flower-100 bg-flower-50' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">{addr.receiverName}</p>
                    <span className="text-gray-400">|</span>
                    <p className="text-sm text-gray-600">{addr.phoneNumber}</p>
                    {addr.isDefault && (
                      <span className="bg-flower-100 text-white text-xs px-2 py-0.5 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{addr.fullAddress}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-flower-100 border border-flower-100 px-3 py-1 rounded-lg hover:bg-flower-50 transition">
                      Đặt mặc định
                    </button>
                  )}
                  <button
                    onClick={() => { setEditAddress(addr); setShowModal(true); }}
                    className="text-xs text-blue-500 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition">
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <AddressModal
          address={editAddress}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAddresses(); }}
        />
      )}
    </div>
  );
};

// ========== ADDRESS MODAL ==========
const AddressModal = ({
  address,
  onClose,
  onSaved,
}: {
  address: AddressResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    receiverName: address?.receiverName || '',
    phoneNumber: address?.phoneNumber || '',
    province: address?.province || '',
    district: address?.district || '',
    ward: address?.ward || '',
    streetAddress: address?.streetAddress || '',
    isDefault: address?.isDefault || false,
  });
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=1')
      .then(r => r.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  const handleProvinceChange = async (name: string) => {
    setForm(prev => ({ ...prev, province: name, district: '', ward: '' }));
    setDistricts([]);
    setWards([]);
    if (!name) return;
    try {
      const province = provinces.find(p => p.name === name);
      if (!province) return;
      const res = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts || []);
    } catch {}
  };

  const handleDistrictChange = async (name: string) => {
    setForm(prev => ({ ...prev, district: name, ward: '' }));
    setWards([]);
    if (!name) return;
    try {
      const district = districts.find(d => d.name === name);
      if (!district) return;
      const res = await fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`);
      const data = await res.json();
      setWards(data.wards || []);
    } catch {}
  };

  const handleSave = async () => {
    if (!form.receiverName || !form.phoneNumber || !form.province ||
        !form.district || !form.ward || !form.streetAddress) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSaving(true);
    try {
      if (address) {
        await addressApi.update(address.id, form);
      } else {
        await addressApi.create(form);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">
            {address ? '✏️ Sửa địa chỉ' : '➕ Thêm địa chỉ mới'}
          </h3>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Họ tên người nhận <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.receiverName}
                onChange={e => setForm({ ...form, receiverName: e.target.value })}
                className={inputClass} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input type="tel" value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                className={inputClass} placeholder="0912345678" />
            </div>
          </div>

          {/* Tỉnh */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <select value={form.province}
              onChange={e => handleProvinceChange(e.target.value)}
              className={inputClass}>
              <option value="">Chọn Tỉnh/Thành phố</option>
              {provinces.map((p: any) => (
                <option key={p.code} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Quận/Huyện */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <select value={form.district}
              onChange={e => handleDistrictChange(e.target.value)}
              disabled={!form.province}
              className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}>
              <option value="">Chọn Quận/Huyện</option>
              {districts.map((d: any) => (
                <option key={d.code} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Phường/Xã */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Phường/Xã <span className="text-red-500">*</span>
            </label>
            <select value={form.ward}
              onChange={e => setForm({ ...form, ward: e.target.value })}
              disabled={!form.district}
              className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}>
              <option value="">Chọn Phường/Xã</option>
              {wards.map((w: any) => (
                <option key={w.code} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Số nhà đường */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Địa chỉ cụ thể <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.streetAddress}
              onChange={e => setForm({ ...form, streetAddress: e.target.value })}
              className={inputClass}
              placeholder="Số nhà, tên đường..." />
          </div>

          {/* Đặt mặc định */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox"
              checked={form.isDefault}
              onChange={e => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 accent-flower-100" />
            <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
          </label>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
            {saving ? 'Đang lưu...' : address ? 'Cập nhật' : 'Thêm địa chỉ'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewOrderModal = ({
  order,
  onClose,
  onSaved,
  onAllReviewed,
}: {
  order: any;
  onClose: () => void;
  onSaved: () => void;
  onAllReviewed: () => void;
}) => {
  const [reviews, setReviews] = useState<Record<number, { rating: number; comment: string }>>(
    Object.fromEntries(
      order.items?.map((item: any) => [
        item.productId,
        { rating: 0, comment: '' }
      ]) || []
    )
  );
  const [hoverRating, setHoverRating] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<number[]>(
    order.items?.filter((item: any) => item.isReviewed).map((item: any) => item.productId) || []
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  const handleSubmitOne = async (productId: number) => {
    const review = reviews[productId];
    if (!review.rating) {
      setErrors(prev => ({ ...prev, [productId]: 'Vui lòng chọn số sao' }));
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.create({
        productId,
        rating: review.rating,
        comment: review.comment,
      });
      setSubmitted(prev => [...prev, productId]);
      setErrors(prev => ({ ...prev, [productId]: '' }));

      const newSubmitted = [...submitted, productId];
      if (order.items?.every((item: any) => newSubmitted.includes(item.productId))) {
        onAllReviewed(); // ← callback báo cho OrdersTab biết
      }
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        [productId]: err.response?.data?.message || 'Có lỗi xảy ra'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const allSubmitted = order.items?.every(
    (item: any) => submitted.includes(item.productId)
  );

  const handleAllDone = () => {
    onSaved(); // đóng modal
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">⭐ Đánh giá đơn #{order.id}</h3>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Danh sách sản phẩm cần đánh giá */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {order.items?.map((item: any) => (
            <div key={item.productId}
              className={`border rounded-xl p-4 transition
                ${submitted.includes(item.productId)
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100'}`}>

              {/* Thông tin sản phẩm */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-flower-50 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={item.productImage
                      ? `https://localhost:7175${item.productImage}`
                      : ''}
                    alt={item.productName}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    x{item.quantity} · {item.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                {submitted.includes(item.productId) && (
                  <span className="text-green-500 text-xl flex-shrink-0">✅</span>
                )}
              </div>

              {submitted.includes(item.productId) ? (
                <p className="text-sm text-green-600 text-center font-medium">
                  Đã đánh giá thành công!
                </p>
              ) : (
                <>
                  {/* Chọn sao */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">Đánh giá:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(prev => ({ ...prev, [item.productId]: star }))}
                          onMouseLeave={() => setHoverRating(prev => ({ ...prev, [item.productId]: 0 }))}
                          onClick={() => {
                            setReviews(prev => ({
                              ...prev,
                              [item.productId]: { ...prev[item.productId], rating: star }
                            }));
                            setErrors(prev => ({ ...prev, [item.productId]: '' }));
                          }}>
                          <svg
                            className={`h-7 w-7 transition
                              ${star <= (hoverRating[item.productId] || reviews[item.productId]?.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-200'}`}
                            fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      {reviews[item.productId]?.rating > 0 && (
                        <span className="text-xs text-yellow-500 ml-1 self-center font-medium">
                          {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][reviews[item.productId].rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nhập bình luận */}
                  <textarea
                    value={reviews[item.productId]?.comment || ''}
                    onChange={(e) => setReviews(prev => ({
                      ...prev,
                      [item.productId]: { ...prev[item.productId], comment: e.target.value }
                    }))}
                    placeholder="Chia sẻ cảm nhận về sản phẩm..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 resize-none mb-2"
                  />

                  {errors[item.productId] && (
                    <p className="text-red-500 text-xs mb-2">{errors[item.productId]}</p>
                  )}

                  <button
                    onClick={() => handleSubmitOne(item.productId)}
                    disabled={submitting}
                    className="w-full py-2 bg-flower-100 text-white text-sm font-medium rounded-xl hover:bg-flower-150 transition disabled:opacity-50">
                    Gửi đánh giá
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {allSubmitted ? (
            <button onClick={handleAllDone}
              className="w-full py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition">
              ✅ Hoàn thành đánh giá
            </button>
          ) : (
            <button onClick={onClose}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;