import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { notificationApi, NotificationDto } from '../api/notificationApi';

// ===== Kiểu dữ liệu thông báo (dùng trong UI) =====
export interface AppNotification {
  id: number;             // > 0: từ server; < 0: tạm thời (lạc quan)
  type: 'order' | 'promotion' | 'birthday' | 'system';
  orderId?: number;
  status?: string;        // Pending | Confirmed | Shipping | Delivered | Cancelled
  title: string;
  message: string;
  imageUrl?: string;
  reason?: string;
  createdAt: string;      // ISO
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & Partial<Pick<AppNotification, 'createdAt'>>) => void;
  markAllRead: () => void;
  markRead: (id: number) => void;
  removeNotification: (id: number) => void;
  clearAll: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications phải dùng bên trong <NotificationProvider>');
  return ctx;
};

const HUB_URL = 'https://localhost:7175/hubs/chat';
const MAX_ITEMS = 60;

function fromDto(d: NotificationDto): AppNotification {
  return {
    id: d.id,
    type: (d.type as AppNotification['type']) ?? 'system',
    orderId: d.orderId ?? undefined,
    status: d.status ?? undefined,
    title: d.title,
    message: d.message,
    imageUrl: d.imageUrl ?? undefined,
    reason: d.reason ?? undefined,
    createdAt: d.createdAt,
    read: d.isRead,
  };
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // Thêm 1 thông báo, khử trùng:
  // - cùng id (>0) -> bỏ qua
  // - cùng orderId+status+type và còn bản tạm thời (id<0) -> thay thế bằng bản mới
  const addNotification = useCallback((n: AppNotification) => {
    setNotifications(prev => {
      if (n.id > 0 && prev.some(p => p.id === n.id)) return prev;
      const withoutOptimisticDup = prev.filter(p =>
        !(p.id < 0 && p.type === n.type && p.orderId === n.orderId && p.status === n.status));
      return [n, ...withoutOptimisticDup].slice(0, MAX_ITEMS);
    });
  }, []);

  const pushNotification: NotificationContextType['pushNotification'] = useCallback((n) => {
    addNotification({
      id: -Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
      ...n,
    });
  }, [addNotification]);

  const refresh = useCallback(() => {
    if (!isAuthenticated) { setNotifications([]); return; }
    notificationApi.getMy(MAX_ITEMS)
      .then(list => setNotifications(list.map(fromDto)))
      .catch(() => { /* giữ nguyên nếu lỗi */ });
  }, [isAuthenticated]);

  // Nạp danh sách khi đăng nhập
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Kết nối SignalR nhận thông báo real-time
  useEffect(() => {
    if (!isAuthenticated) {
      connectionRef.current?.stop().catch(() => {});
      connectionRef.current = null;
      return;
    }

    const token = localStorage.getItem('token');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token || '' })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (payload: any) => {
      if (!payload) return;
      addNotification(fromDto({
        id: Number(payload.id ?? payload.Id ?? 0),
        type: payload.type ?? payload.Type ?? 'system',
        orderId: payload.orderId ?? payload.OrderId ?? null,
        status: payload.status ?? payload.Status ?? null,
        title: payload.title ?? payload.Title ?? 'Thông báo',
        message: payload.message ?? payload.Message ?? '',
        imageUrl: payload.imageUrl ?? payload.ImageUrl ?? null,
        reason: payload.reason ?? payload.Reason ?? null,
        isRead: payload.isRead ?? payload.IsRead ?? false,
        createdAt: payload.createdAt ?? payload.CreatedAt ?? new Date().toISOString(),
      }));
    });

    connection.start().catch(err => console.error('Notification SignalR error:', err));
    connectionRef.current = connection;

    return () => { connection.stop().catch(() => {}); };
  }, [isAuthenticated, addNotification]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationApi.markAllRead().catch(() => {});
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    if (id > 0) notificationApi.markRead(id).catch(() => {});
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (id > 0) notificationApi.remove(id).catch(() => {});
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    notificationApi.clearAll().catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, pushNotification, markAllRead, markRead, removeNotification, clearAll, refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
