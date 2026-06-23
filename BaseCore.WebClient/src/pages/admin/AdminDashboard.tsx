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
    roles: [],
  },
  {
    label: 'Biên lai',
    path: '/admin/receipts',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    roles: ['Admin', 'Supplier', 'Seller'],
  },
  {
    label: 'Đề nghị',
    path: '/admin/proposals',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['Supplier'],
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
    roles: [],
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
    roles: ['Admin', 'Seller'],
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
      roles: ['Seller'],
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
    roles: [],
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

  // Kết nối SignalR để nhận tin nhắn và thông báo mới
  useEffect(() => {
    const token = localStorage.getItem('token');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7175/hubs/chat', {
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

    // Nhận thông báo đơn hàng mới thời gian thực
    connection.on('ReceiveOrderNotification', (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Cũng trigger re-fetch toàn bộ thông tin
      fetchAll();
    });

    // Nhận thông báo cập nhật trạng thái đơn hàng thời gian thực
    connection.on('ReceiveOrderStatusUpdate', (data: any) => {
      fetchAll();
    });

    connection.start().catch(err => console.error('SignalR:', err));
    chatConnectionRef.current = connection;

    return () => { connection.stop(); };
  }, []);

  useEffect(() => {
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
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-flower-50 border-r border-flower-100/20 flex flex-col transition-all duration-300 flex-shrink-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-flower-100/20">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-1.5 text-lg font-bold text-flower-100 brand-wordmark whitespace-nowrap">
              <span>3TL-Store</span>
              <span className="brand-role text-[10px] font-semibold px-1.5 py-0.5 bg-flower-100 text-white rounded flex-shrink-0">
                {isSupplier ? 'SUPPLIER' : isSeller ? 'SELLER' : 'ADMIN'}
              </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-flower-100 hover:text-flower-150 hover:bg-white/55 rounded-lg transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
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
                  ? 'bg-flower-100 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-white/40 hover:text-gray-800'}`}
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
                      : `https://localhost:7175${user.avatarUrl}`}
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
            ? (isSupplier ? <SupplierDashboardHome /> : <DashboardHome />)
            : <Outlet />
          }
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const { isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for revenue details modal
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);
  const [revenueDetailsList, setRevenueDetailsList] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, r, t, ro] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRevenueChart(),
        dashboardApi.getTopProducts(),
        dashboardApi.getRecentOrders(),
      ]);
      setStats(s);
      setRevenueChart(r);
      setTopProducts(t);
      setRecentOrders(ro);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRevenueClick = async () => {
    if (!isAdmin) return;
    setShowRevenueDetails(true);
    setDetailsLoading(true);
    try {
      const res = await axiosClient.get('/Dashboard/revenue-details');
      setRevenueDetailsList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    Pending:   '#F59E0B',
    Confirmed: '#8B5CF6',
    Shipping:  '#8B5CF6',
    Delivered: '#10B981',
    Cancelled: '#EF4444',
  };

  const statusLabels: Record<string, string> = {
    Pending:   'Chờ xác nhận',
    Confirmed: 'Đang giao',
    Shipping:  'Đang giao',
    Delivered: 'Đã giao',
    Cancelled: 'Đã hủy',
  };

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const cards = [
    {
      label: 'Lãi (Doanh thu)',
      value: stats?.totalProfit !== undefined ? `${stats.totalProfit.toLocaleString('vi-VN')}đ` : '0đ',
      icon: '💰',
      color: 'bg-flower-100 text-white',
      clickable: isAdmin,
      onClick: handleRevenueClick,
      tooltip: isAdmin ? 'Click để xem chi tiết doanh thu từng sản phẩm' : undefined
    },
    {
      label: 'Đơn hàng',
      value: stats?.totalOrders?.toString() || '0',
      icon: '🛒',
      color: 'bg-blue-100 text-blue-700',
      clickable: true,
      onClick: () => navigate('/admin/orders')
    },
    {
      label: 'Chờ xác nhận',
      value: stats?.pendingOrders?.toString() || '0',
      icon: '⏳',
      color: 'bg-yellow-100 text-yellow-700',
      clickable: true,
      onClick: () => navigate('/admin/orders?status=Pending')
    },
    {
      label: 'Đơn hàng đã hủy',
      value: stats?.cancelledOrders?.toString() || '0',
      icon: '❌',
      color: 'bg-red-100 text-red-700',
      clickable: true,
      onClick: () => navigate('/admin/orders?status=Cancelled')
    },
    {
      label: 'Biên lai đang chờ',
      value: stats?.pendingReceipts?.toString() || '0',
      icon: '📦',
      color: 'bg-indigo-100 text-indigo-700',
      clickable: true,
      onClick: () => navigate('/admin/receipts')
    },
    {
      label: 'Tin nhắn chờ',
      value: stats?.waitingMessages?.toString() || '0',
      icon: '💬',
      color: 'bg-purple-100 text-purple-700',
      clickable: true,
      onClick: () => navigate('/admin/chat')
    }
  ];

  return (
    <div className="space-y-6">

      {/* Stats cards - Alternating between pink and white */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cards.map((card, index) => {
          const isPink = index % 2 === 0;
          return (
            <div
              key={card.label}
              onClick={card.onClick}
              title={card.tooltip}
              className={`rounded-2xl p-4 border transition-all duration-200
                ${isPink ? 'bg-flower-50 border-flower-100/30' : 'bg-white border-gray-150'}
                ${card.clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : 'cursor-default'}`}
            >
              <div className={`inline-flex p-2 rounded-xl ${card.color} mb-3`}>
                <span className="text-lg">{card.icon}</span>
              </div>
              <p className="text-lg font-bold text-gray-800 truncate" title={card.value}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-semibold">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart and Top Products side-by-side */}
      <div className="grid grid-cols-3 gap-5">

        {/* 7-day revenue parabol line chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">📈 Doanh thu 7 ngày gần nhất (tiền đồng)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toLocaleString('vi-VN')}k`}
              />
              <Tooltip
                formatter={(value: any) => [
                  `${Number(value).toLocaleString('vi-VN')}đ`,
                  'Doanh thu'
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#E4959A"
                strokeWidth={3}
                dot={{ fill: '#E4959A', r: 5 }}
                activeDot={{ r: 8 }}
                name="Doanh thu"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top sản phẩm bán chạy */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">🏆 Top sản phẩm bán chạy</h3>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-3xl mb-2">📦</span>
              <p className="text-sm">Chưa có dữ liệu bán hàng</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              {topProducts.map((p, i) => (
                <div
                  key={p.productId}
                  onClick={() => navigate(`/admin/products?keyword=${encodeURIComponent(p.productName)}`)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition"
                  title="Click để tìm kiếm sản phẩm"
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                    ${i === 0 ? 'bg-yellow-400 text-white'
                    : i === 1 ? 'bg-gray-300 text-white'
                    : i === 2 ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 flex-shrink-0 bg-flower-50 rounded-lg overflow-hidden flex items-center justify-center">
                    {p.productImage ? (
                      <img
                        src={getImageUrl(p.productImage)}
                        alt={p.productName}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-xl">🧱</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.productName}</p>
                    <p className="text-[10px] text-gray-400">Đã bán: {p.totalSold} sp</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-flower-100">
                      {p.totalRevenue >= 1000000 
                        ? `${(p.totalRevenue / 1000000).toFixed(1)}M` 
                        : `${(p.totalRevenue / 1000).toFixed(0)}k`}
                    </p>
                    <p className="text-[9px] text-gray-400">doanh thu</p>
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
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Doanh thu</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Trạng thái</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/admin/orders`)}
                  className="hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="py-2.5 text-sm font-semibold text-flower-100">
                    #{order.id}
                  </td>
                  <td className="py-2.5 text-sm text-gray-700">{order.customerName}</td>
                  <td className="py-2.5 text-sm font-medium">
                    {order.revenue === 0 ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span className={order.revenue < 0 ? 'text-red-500' : 'text-gray-800'}>
                        {order.revenue.toLocaleString('vi-VN')}đ
                      </span>
                    )}
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

      {/* Revenue Details Modal */}
      {showRevenueDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-flower-50/50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                💰 Chi tiết doanh thu & lợi nhuận sản phẩm
              </h3>
              <button
                onClick={() => setShowRevenueDetails(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {detailsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : revenueDetailsList.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu lợi nhuận sản phẩm nào.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[11px] tracking-wider text-left">
                        <th className="pb-3 pl-2">Sản phẩm</th>
                        <th className="pb-3 text-center">Số lượng bán</th>
                        <th className="pb-3 text-right">Giá bán TB</th>
                        <th className="pb-3 text-right">Giá nhập (vốn)</th>
                        <th className="pb-3 text-right pr-2">Lợi nhuận (lãi)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {revenueDetailsList.map((item) => (
                        <tr key={item.productId} className="hover:bg-gray-50/50 transition">
                          <td className="py-3.5 pl-2 flex items-center gap-3">
                            <div className="w-10 h-10 bg-flower-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-flower-100/10">
                              {item.productImage ? (
                                <img
                                  src={getImageUrl(item.productImage)}
                                  alt={item.productName}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <span className="text-xl">🧱</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-800 line-clamp-1">{item.productName}</span>
                          </td>
                          <td className="py-3.5 text-center font-semibold text-gray-700">{item.quantity}</td>
                          <td className="py-3.5 text-right font-medium text-gray-800">
                            {Math.round(item.averagePrice).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-3.5 text-right text-gray-500">
                            {item.importPrice.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <span className={`font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {item.profit >= 0 ? '+' : ''}{item.profit.toLocaleString('vi-VN')}đ
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                onClick={() => setShowRevenueDetails(false)}
                className="px-5 py-2 bg-flower-100 text-white rounded-xl text-sm font-semibold hover:bg-flower-150 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Supplier Dashboard Home ──────────────────────────────────────────────────
const SupplierDashboardHome = () => {
  const { user } = useAuth();
  const [receiptStats, setReceiptStats] = useState<any>(null);
  const [proposalStats, setProposalStats] = useState<any>(null);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [stockBatches, setStockBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rStats, pStats, receipts, proposals, batches] = await Promise.all([
          axiosClient.get('/SupplierReceipts/stats').catch(() => ({ data: null })),
          axiosClient.get('/SupplierProposals/stats').catch(() => ({ data: null })),
          axiosClient.get('/SupplierReceipts').catch(() => ({ data: [] })),
          axiosClient.get('/SupplierProposals').catch(() => ({ data: [] })),
          axiosClient.get('/StockBatches').catch(() => ({ data: [] })),
        ]);
        setReceiptStats(rStats.data);
        setProposalStats(pStats.data);
        setRecentReceipts((receipts.data || []).slice(0, 5));
        setRecentProposals((proposals.data || []).slice(0, 5));
        setStockBatches((batches.data || []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const kpiCards = [
    {
      label: 'Biên lai chờ xác nhận',
      value: receiptStats?.pending ?? 0,
      icon: '📋',
      color: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      action: () => navigate('/admin/receipts?status=Pending'),
    },
    {
      label: 'Biên lai đã xác nhận',
      value: receiptStats?.confirmed ?? 0,
      icon: '✅',
      color: 'from-emerald-400 to-green-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      action: () => navigate('/admin/receipts?status=Confirmed'),
    },
    {
      label: 'Đề nghị đang chờ duyệt',
      value: proposalStats?.pending ?? 0,
      icon: '📤',
      color: 'from-blue-400 to-indigo-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      action: () => navigate('/admin/proposals?status=Pending'),
    },
    {
      label: 'Đề nghị được chấp nhận',
      value: (proposalStats?.approved ?? 0) + (proposalStats?.completed ?? 0),
      icon: '🎉',
      color: 'from-violet-400 to-purple-500',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      action: () => navigate('/admin/proposals?status=Approved'),
    },
  ];

  const receiptStatusLabels: Record<string, string> = {
    Pending: '⏳ Chờ xác nhận',
    Confirmed: '✅ Đã xác nhận',
    Disputed: '⚠️ Đang khiếu nại',
    Resolved: '🔧 Đã giải quyết',
  };
  const receiptStatusColors: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-600',
    Confirmed: 'bg-emerald-50 text-emerald-600',
    Disputed: 'bg-red-50 text-red-600',
    Resolved: 'bg-blue-50 text-blue-600',
  };
  const proposalStatusColors: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-600',
    Approved: 'bg-emerald-50 text-emerald-600',
    Rejected: 'bg-red-50 text-red-600',
    Completed: 'bg-blue-50 text-blue-600',
  };
  const proposalStatusLabels: Record<string, string> = {
    Pending: '⏳ Chờ duyệt',
    Approved: '✅ Được duyệt',
    Rejected: '❌ Từ chối',
    Completed: '🎉 Hoàn tất',
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-flower-100 via-pink-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80 mb-1">Chào mừng trở lại,</p>
          <h1 className="text-2xl font-bold mb-1">{user?.fullName} 👋</h1>
          <p className="text-sm opacity-75">Nhà cung cấp · <span className="brand-wordmark">3TL-Store</span> <span className="brand-role">SUPPLIER</span></p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-4 -bottom-12 w-56 h-56 bg-white/10 rounded-full" />
        <div className="absolute top-4 right-8 text-6xl opacity-20">🏭</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <button
            key={card.label}
            onClick={card.action}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md transition group"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${card.bg} mb-3 group-hover:scale-110 transition-transform`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {loading ? <span className="inline-block w-12 h-8 bg-gray-100 rounded animate-pulse" /> : card.value}
            </p>
            <p className={`text-xs font-medium ${card.text}`}>{card.label}</p>
          </button>
        ))}
      </div>

      {/* Tổng doanh thu đã xác nhận */}
      {receiptStats?.totalAmount > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600 mb-1">💰 Tổng giá trị biên lai đã xác nhận</p>
            <p className="text-3xl font-bold text-emerald-700">
              {receiptStats.totalAmount.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <div className="text-5xl opacity-30">💵</div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/admin/proposals')}
          className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-flower-100 hover:shadow-md transition group text-left"
        >
          <div className="w-12 h-12 bg-flower-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📤
          </div>
          <div>
            <p className="font-semibold text-gray-800">Tạo đề nghị mới</p>
            <p className="text-xs text-gray-400">Gửi đề xuất cung ứng hàng cho Admin</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/receipts')}
          className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-flower-100 hover:shadow-md transition group text-left"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📋
          </div>
          <div>
            <p className="font-semibold text-gray-800">Xem biên lai</p>
            <p className="text-xs text-gray-400">Xác nhận hoặc khiếu nại biên lai từ Admin</p>
          </div>
        </button>
      </div>

      {/* Two-column: Recent receipts + Recent proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Receipts */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">📋 Biên lai gần đây</h3>
            <button onClick={() => navigate('/admin/receipts')}
              className="text-xs text-flower-100 hover:underline">Xem tất cả</button>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-4xl mb-2">📋</span>
              <p className="text-sm">Chưa có biên lai nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentReceipts.map(r => (
                <div key={r.id}
                  onClick={() => navigate('/admin/receipts')}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-flower-100">{r.receiptCode}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{r.productName} × {r.quantity}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${receiptStatusColors[r.status] || 'bg-gray-100 text-gray-500'}`}>
                    {receiptStatusLabels[r.status] || r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Proposals */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">📤 Đề nghị gần đây</h3>
            <button onClick={() => navigate('/admin/proposals')}
              className="text-xs text-flower-100 hover:underline">Xem tất cả</button>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-4xl mb-2">📤</span>
              <p className="text-sm">Chưa có đề nghị nào</p>
              <button
                onClick={() => navigate('/admin/proposals')}
                className="mt-3 px-4 py-1.5 bg-flower-100 text-white rounded-full text-xs hover:bg-flower-150 transition">
                Tạo đề nghị mới
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentProposals.map(p => (
                <div key={p.id}
                  onClick={() => navigate('/admin/proposals')}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-flower-100">{p.proposalCode}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{p.productName} × {p.proposedQuantity}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${proposalStatusColors[p.status] || 'bg-gray-100 text-gray-500'}`}>
                    {proposalStatusLabels[p.status] || p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent stock activity */}
      {stockBatches.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">📦 Lô hàng nhập kho gần đây</h3>
            <button onClick={() => navigate('/admin/stock')}
              className="text-xs text-flower-100 hover:underline">Xem tất cả</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Mã lô</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Ngày nhập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stockBatches.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-sm font-mono text-flower-100">{b.batchCode}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{b.productName}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800">{b.quantity}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(b.importDate).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;