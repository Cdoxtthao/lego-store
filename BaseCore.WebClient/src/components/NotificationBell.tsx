import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { getImageUrl } from '../utils/imageHelper';

// Màu badge trạng thái
const statusStyle: Record<string, { label: string; cls: string }> = {
  Pending:   { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  Confirmed: { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700' },
  Shipping:  { label: 'Đang giao',    cls: 'bg-indigo-100 text-indigo-700' },
  Delivered: { label: 'Đã nhận',      cls: 'bg-green-100 text-green-700' },
  Cancelled: { label: 'Đã hủy',       cls: 'bg-red-100 text-red-700' },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markRead, removeNotification, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Đóng khi click ra ngoài
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = () => {
    setOpen(o => {
      if (!o && unreadCount > 0) markAllRead();
      return !o;
    });
  };

  const onItemClick = (n: AppNotification) => {
    markRead(n.id);
    if (n.orderId) {
      setOpen(false);
      navigate('/orders');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="p-2 text-gray-500 hover:text-flower-100 transition relative"
        aria-label="Thông báo">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-flower-100 text-white text-xs rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-sm text-gray-800">Thông báo</p>
            {notifications.length > 0 && (
              <button onClick={clearAll}
                className="text-xs text-gray-400 hover:text-flower-100 transition">
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                <svg className="h-10 w-10 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map(n => {
                const st = n.status ? statusStyle[n.status] : undefined;
                return (
                  <div key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition hover:bg-flower-50 ${n.read ? '' : 'bg-flower-50/60'}`}>
                    <div className="w-12 h-12 rounded-lg bg-flower-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {n.imageUrl ? (
                        <img src={getImageUrl(n.imageUrl)} alt="" className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <svg className="h-5 w-5 text-flower-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        {st && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                      {n.reason && (
                        <p className="text-xs text-red-500 mt-0.5 italic">Lý do: {n.reason}</p>
                      )}
                      <p className="text-[11px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                      className="text-gray-300 hover:text-red-400 transition flex-shrink-0"
                      aria-label="Xóa">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
