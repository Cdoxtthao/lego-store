import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { getImageUrl } from '../../utils/imageHelper';
import axiosClient from '../../api/axiosClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as signalR from '@microsoft/signalr';
import { useRef } from 'react';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['Admin', 'Seller', 'Supplier'],
  },
  {
    label: 'Sản phẩm',
    path: '/admin/products',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    roles: ['Admin', 'Seller', 'Supplier'],
  },
  {
    label: 'Đơn hàng',
    path: '/admin/orders',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    roles: ['Admin', 'Seller'],
  },
  {
    label: 'Khuyến mãi', 
    path: '/admin/promotions',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    roles: ['Admin', 'Seller'],
  },
  {
    label: 'Nhập kho',  
    path: '/admin/stock',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    roles: ['Admin', 'Supplier'],
  },
  {
    label: 'Hàng trả lại',  
    path: '/admin/returns',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
    roles: ['Admin', 'Supplier'],
  },
  {
    label: 'Người dùng',
    path: '/admin/users',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: ['Admin'],
  },
  {
    label: 'Đối tác', 
    path: '/admin/suppliers',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['Admin'],
  },
  {
    label: 'Danh mục',
    path: '/admin/categories',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    roles: ['Admin'],
  },
  {
      label: 'Tin nhắn',
      path: '/admin/chat',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      roles: ['Admin', 'Seller'],
  },
  {
    label: 'Cài đặt',
    path: '/admin/settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['Admin'],
  },
];

const AdminDashboard = () => {
  const { user, logout, isAdmin, isSeller, isSupplier } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const chatConnectionRef = useRef<any>(null);
  const [notifTab, setNotifTab] = useState<'notifications' | 'messages'>('notifications');
  const readIdsRef = useRef<Set<string>>(new Set());

  const filteredMenu = menuItems.filter(item =>
    item.roles.some(role =>
      (role === 'Admin' && isAdmin) ||
      (role === 'Seller' && isSeller) ||
      (role === 'Supplier' && isSupplier)
    )
  );

  // Kết nối SignalR để nhận tin nhắn mới
  useEffect(() => {
    const token = localStorage.getItem('token');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5210/hubs/chat', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();

    // Nhận tin nhắn mới từ user
    connection.on('ReceiveUserMessage', (msg: any) => {
      if (msg.isFromUser) {
        // Thêm vào danh sách thông báo
        setNotifications(prev => [{
          id: `msg-${msg.id || Date.now()}`,
          type: 'new_message',
          title: 'Tin nhắn mới',
          message: `${msg.userName}: ${msg.content}`,
          createdAt: msg.createdAt || new Date().toISOString(),
          isRead: false,
          link: '/admin/chat',
        }, ...prev]);

        setUnreadCount(prev => prev + 1);
        setUnreadMessages(prev => prev + 1);
      }
    });

    connection.start().catch(err => console.error('SignalR:', err));
    chatConnectionRef.current = connection;

    return () => { connection.stop(); };
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch notifications
        const notifRes = await axiosClient.get('/Dashboard/notifications');
        const notifs = notifRes.data;
        setUnreadCount(notifs.filter((n: any) => !n.isRead).length);

        // Fetch tin nhắn chưa đọc
        const msgRes = await axiosClient.get('/Messages/conversations');
        const unreadConvs = msgRes.data.filter((c: any) => c.unreadCount > 0);

        const msgNotifs = unreadConvs.map((c: any) => ({
          id: `msg-${c.userId}`,
          type: 'new_message',
          title: 'Tin nhắn chưa đọc',
          message: `${c.userName}: ${c.lastMessage}`,
          createdAt: c.lastTime,
          isRead: false,
          link: '/admin/chat',
          unreadCount: c.unreadCount,
        }));

        const allNotifs = [...msgNotifs, ...notifs];
        const withReadState = allNotifs.map(n => ({
            ...n,
            isRead: readIdsRef.current.has(n.id) ? true : n.isRead,
        }));
        setNotifications(withReadState);

        const unreadNotifs = withReadState.filter(
          n => !n.isRead && n.type !== 'new_message'
        ).length;
        const unreadMsgs = withReadState.filter(
          n => !n.isRead && n.type === 'new_message'
        ).length;

        setUnreadCount(unreadNotifs);
        setUnreadMessages(unreadMsgs);

      } catch (err) {
        console.error(err);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = () => {
    notifications.forEach(n => readIdsRef.current.add(n.id));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setUnreadMessages(0);
  };

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 flex-shrink-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          {!collapsed && (
            <Link to="/" className="text-lg font-bold text-flower-100"
              style={{ fontFamily: 'Georgia, serif' }}>
              BrickDo Admin
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition
                ${isActive(item.path)
                  ? 'bg-flower-50 text-flower-100 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              {item.icon}
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-flower-100 flex items-center justify-center flex-shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl.startsWith('http')
                      ? user.avatarUrl
                      : `http://localhost:5210${user.avatarUrl}`}
                    alt={user?.fullName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className={`flex items-center gap-3 w-full px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition text-sm
              ${collapsed ? 'justify-center' : ''}`}>
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {filteredMenu.find(m => isActive(m.path))?.label || 'Dashboard'}
            </h1>
            <p className="text-xs text-gray-400">
              Xin chào, {user?.fullName} ({user?.role})
            </p>
          </div>
  <div className="flex items-center gap-4">

    {/* Nút thông báo */}
    <div className="relative">
      <button
        onClick={() => { setShowNotif(!showNotif); if (!showNotif) markAllRead(); }}
        className="relative p-2 text-gray-500 hover:text-flower-100 hover:bg-flower-50 rounded-xl transition">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge số thông báo */}
        {(unreadCount + unreadMessages) > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {(unreadCount + unreadMessages) > 9 ? '9+' : (unreadCount + unreadMessages)}
          </span>
        )}
      </button>

      {/* Dropdown thông báo */}
      {showNotif && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />

          <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">Thông báo</h3>
              <button
                onClick={markAllRead}
                className="text-xs text-flower-100 hover:underline">
                Đánh dấu đã đọc
              </button>
            </div>

            {/* Tab — Thông báo / Tin nhắn */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setNotifTab('notifications')}
                className={`flex-1 py-2 text-xs font-medium transition
                  ${notifTab === 'notifications'
                    ? 'text-flower-100 border-b-2 border-flower-100'
                    : 'text-gray-400 hover:text-gray-600'}`}>
                🔔 Thông báo
                {unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setNotifTab('messages'); setUnreadMessages(0); }}
                className={`flex-1 py-2 text-xs font-medium transition
                  ${notifTab === 'messages'
                    ? 'text-flower-100 border-b-2 border-flower-100'
                    : 'text-gray-400 hover:text-gray-600'}`}>
                💬 Tin nhắn
                {unreadMessages > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>

            {/* Nội dung theo tab */}
            <div className="max-h-80 overflow-y-auto">

              {notifTab === 'notifications' ? (
                // Tab thông báo cũ
                notifications.filter(n => n.type !== 'new_message').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <span className="text-3xl mb-2">🔔</span>
                    <p className="text-sm">Không có thông báo nào</p>
                  </div>
                ) : (
                  notifications.filter(n => n.type !== 'new_message').map((notif: any) => (
                    <Link key={notif.id} to={notif.link}
                      onClick={() => setShowNotif(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0
                        ${!notif.isRead ? 'bg-flower-50' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
                        ${notif.type === 'new_order' ? 'bg-green-100'
                        : notif.type === 'pending_order' ? 'bg-yellow-100'
                        : 'bg-red-100'}`}>
                        {notif.type === 'new_order' ? '🛒'
                          : notif.type === 'pending_order' ? '⏳'
                          : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{notif.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-flower-100 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </Link>
                  ))
                )
              ) : (
                // Tab tin nhắn
                notifications.filter(n => n.type === 'new_message').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <span className="text-3xl mb-2">💬</span>
                    <p className="text-sm">Chưa có tin nhắn mới</p>
                    <Link to="/admin/chat"
                      onClick={() => setShowNotif(false)}
                      className="mt-2 text-xs text-flower-100 hover:underline">
                      Xem tất cả tin nhắn →
                    </Link>
                  </div>
                ) : (
                  notifications.filter(n => n.type === 'new_message').map((notif: any) => (
                    <Link key={notif.id} to="/admin/chat"
                      onClick={() => setShowNotif(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0
                        ${!notif.isRead ? 'bg-flower-50' : ''}`}>
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-lg">
                        💬
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{notif.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-flower-100 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </Link>
                  ))
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <Link to="/admin/chat"
                onClick={() => setShowNotif(false)}
                className="text-xs text-flower-100 hover:underline">
                Xem tất cả tin nhắn →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>

            <Link to="/"
              className="text-sm text-flower-100 hover:underline flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Về trang chủ
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Chỉ hiện stats khi ở trang dashboard chính */}
          {location.pathname === '/admin'
            ? <DashboardHome />
            : <Outlet />
          }
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [orderStatusChart, setOrderStatusChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, r, o, t, ro] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRevenueChart(),
          dashboardApi.getOrderStatusChart(),
          dashboardApi.getTopProducts(),
          dashboardApi.getRecentOrders(),
        ]);
        setStats(s);
        setRevenueChart(r);
        setOrderStatusChart(o);
        setTopProducts(t);
        setRecentOrders(ro);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statusColors: Record<string, string> = {
    Pending:   '#F59E0B',
    Confirmed: '#3B82F6',
    Shipping:  '#8B5CF6',
    Delivered: '#10B981',
    Cancelled: '#EF4444',
  };

  const statusLabels: Record<string, string> = {
    Pending:   'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Shipping:  'Đang giao',
    Delivered: 'Đã giao',
    Cancelled: 'Đã hủy',
  };

  if (loading) return (
    <div className="grid grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-5">
        {[
          {
            label: 'Tổng sản phẩm',
            value: stats?.totalProducts?.toLocaleString() || '0',
            icon: '📦',
            color: 'bg-blue-50 text-blue-600',
            change: `+${stats?.newProductsThisWeek || 0} tuần này`,
            changeColor: 'text-blue-500',
          },
          {
            label: 'Đơn hàng hôm nay',
            value: stats?.newOrdersToday?.toLocaleString() || '0',
            icon: '🛒',
            color: 'bg-green-50 text-green-600',
            change: `${stats?.pendingOrders || 0} chờ xử lý`,
            changeColor: 'text-orange-500',
          },
          {
            label: 'Người dùng',
            value: stats?.totalUsers?.toLocaleString() || '0',
            icon: '👥',
            color: 'bg-purple-50 text-purple-600',
            change: `+${stats?.newUsersThisWeek || 0} tuần này`,
            changeColor: 'text-purple-500',
          },
          {
            label: 'Doanh thu tháng',
            value: stats?.revenueThisMonth
              ? `${(stats.revenueThisMonth / 1000000).toFixed(1)}M`
              : '0',
            icon: '💰',
            color: 'bg-flower-50 text-flower-100',
            change: `${stats?.revenueGrowth >= 0 ? '+' : ''}${stats?.revenueGrowth || 0}% so với tháng trước`,
            changeColor: stats?.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500',
          },
        ].map(stat => (
          <div key={stat.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition">
            <div className={`inline-flex p-2.5 rounded-xl ${stat.color} mb-3`}>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            <p className={`text-xs mt-1 ${stat.changeColor}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-5">

        {/* Biểu đồ doanh thu 6 tháng */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">📈 Doanh thu 6 tháng gần nhất</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(value: any) => [
                  `${Number(value).toLocaleString('vi-VN')}đ`,
                  'Doanh thu'
                ]}
              />
              <Bar dataKey="revenue" fill="#E4959A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ trạng thái đơn hàng */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">🥧 Trạng thái đơn hàng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={orderStatusChart.filter(d => d.count > 0)}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }: any) =>
                  `${statusLabels[name] || name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}>
                {orderStatusChart.map((entry: any, index: number) => (
                  <Cell
                    key={'cell-${index}'}
                    fill={statusColors[entry.status] || '#ccc'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, statusLabels[name as string] || name]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
            {orderStatusChart.filter(d => d.count > 0).map(d => (
              <div key={d.status} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full"
                  style={{ background: statusColors[d.status] }} />
                <span className="text-xs text-gray-500">
                  {statusLabels[d.status]}: {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-5">

        {/* Biểu đồ đơn hàng theo tháng */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">📊 Số đơn hàng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orderCount"
                stroke="#E4959A"
                strokeWidth={2}
                dot={{ fill: '#E4959A', r: 4 }}
                name="Đơn hàng"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top sản phẩm bán chạy */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">🏆 Top sản phẩm bán chạy</h3>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-2">📦</span>
              <p className="text-sm">Chưa có dữ liệu bán hàng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i === 0 ? 'bg-yellow-400 text-white'
                    : i === 1 ? 'bg-gray-300 text-white'
                    : i === 2 ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 flex-shrink-0 bg-flower-50 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(p.productImage)}
                      alt={p.productName}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.productName}</p>
                    <p className="text-xs text-gray-400">Đã bán: {p.totalSold} sp</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-flower-100">
                      {(p.totalRevenue / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-400">doanh thu</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Đơn hàng gần đây */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">🕐 Đơn hàng gần đây</h3>
          <Link to="/admin/orders"
            className="text-sm text-flower-100 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <span className="text-3xl block mb-2">📋</span>
            <p className="text-sm">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Mã đơn</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Khách hàng</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Tổng tiền</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Trạng thái</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="py-2.5 text-sm font-semibold text-flower-100">
                    #{order.id}
                  </td>
                  <td className="py-2.5 text-sm text-gray-700">{order.customerName}</td>
                  <td className="py-2.5 text-sm font-medium text-gray-800">
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium`}
                      style={{
                        background: `${statusColors[order.status]}20`,
                        color: statusColors[order.status],
                      }}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
