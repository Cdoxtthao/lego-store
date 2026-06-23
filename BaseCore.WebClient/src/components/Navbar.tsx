import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productApi } from '../api/productApi';
import { ProductResponse } from '../types';
import { categoryApi, CategoryResponse } from '../api/categoryApi';
import { themeApi, ThemeResponse } from '../api/themeApi';
import { CartResponse } from '../types';
import { cartApi } from '../api/cartApi';
import { getImageUrl } from '../utils/imageHelper';
import { useWishlist } from '../context/WishlistContext';
import * as signalR from '@microsoft/signalr';
import NotificationBell from './NotificationBell';

// =================== THANH THÔNG BÁO ==========================
const announcements = [
  { text: '🚚 Miễn phí vận chuyển cho đơn hàng từ 500.000đ', link: '/products' },
  { text: '🎁 Mua 2 tặng 1 cho nhiều sản phẩm chọn lọc', link: '/products?theme=City' },
  { text: '⚡ Flash sale mỗi ngày 12h - 14h — Giảm đến 30%', link: '/products?sortBy=price_asc' },
  { text: '🌟 Thành viên mới đăng ký nhận ngay voucher 50.000đ', link: '/register' },
  { 
    text: (
      <>🎄 Bộ sưu tập mới nhất vừa về — {'  '}
        <span className="underline font-semibold"> Xem ngay</span>
      </>
    ), 
    link: '/products?sortBy=newest' 
  },
];

const AnnouncementBar = () => {
  const [current, setCurrent] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  const goTo = (newIndex: number, dir: 'left' | 'right') => {
    if (sliding) return;
    setDirection(dir);
    setSliding(true);
    setTimeout(() => {
      setCurrent(newIndex);
      setSliding(false);
    }, 400);
  };

  const prev = () => {
    const newIndex = (current - 1 + announcements.length) % announcements.length;
    goTo(newIndex, 'right');
  };

  const next = () => {
    const newIndex = (current + 1) % announcements.length;
    goTo(newIndex, 'left');
  };

  useEffect(() => {
    const timer = setInterval(() => next(), 3500);
    return () => clearInterval(timer);
  }, [current]);

  return (
    <div className="bg-flower-100 text-white text-sm py-2 px-4 flex items-center justify-between overflow-hidden">

      {/* Mũi tên trái */}
      <button
        onClick={prev}
        className="p-1 hover:bg-white/20 rounded-full transition flex-shrink-0"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Nội dung — slide animation */}
      <div className="flex-1 overflow-hidden mx-4 text-center relative h-5">
        <Link
          to={announcements[current].link}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: sliding
              ? `slideOut${direction === 'left' ? 'Left' : 'Right'} 0.35s ease forwards`
              : `slideIn${direction === 'left' ? 'Right' : 'Left'} 0.35s ease forwards`,
          }}
        >
          {announcements[current].text}
        </Link>
      </div>

      {/* Mũi tên phải */}
      <button
        onClick={next}
        className="p-1 hover:bg-white/20 rounded-full transition flex-shrink-0"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0);   opacity: 1; }
          to   { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ================ CHATBOX ==========================
interface ChatMessage {
  isFromUser: boolean;
  content: string;
  createdAt?: string;
}

const ChatBox = ({ onClose }: { onClose: () => void }) => {
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { isFromUser: false, content: 'Xin chào! Tôi có thể giúp gì cho bạn? 😊' }
  ]);
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7175/hubs/chat', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveMessage', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    connection.start()
      .then(() => setConnected(true))
      .catch(err => console.error('SignalR error:', err));

    connectionRef.current = connection;

    // Load lịch sử
    fetch('https://localhost:7175/api/Messages/my', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
        }
      })
      .catch(() => {});

    return () => {
      connection.stop();
    };
  }, [isAuthenticated]);

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!isAuthenticated) {
      setMessages(prev => [...prev,
        { isFromUser: true, content: message },
        { isFromUser: false, content: '⚠️ Vui lòng đăng nhập để gửi tin nhắn!' }
      ]);
      setMessage('');
      return;
    }

    try {
      await connectionRef.current?.invoke('SendMessage', message);
      setMessage('');
    } catch {
      setMessages(prev => [...prev, {
        isFromUser: false,
        content: 'Không thể gửi tin nhắn. Vui lòng thử lại!'
      }]);
    }
  };


  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden"
      style={{ height: '420px' }}>

      {/* Header */}
      <div className="bg-flower-100 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Tư vấn viên</p>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-300' : 'bg-gray-300'}`} />
              <p className="text-xs text-white/70">
                {connected ? 'Đang online' : 'Đang kết nối...'}
              </p>
            </div>
          </div>
        </div>
        <button onClick={onClose}
          className="hover:bg-white/20 p-1 rounded-full transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm
              ${msg.isFromUser
                ? 'bg-flower-100 text-white rounded-br-sm'
                : 'bg-white text-gray-700 shadow-sm rounded-bl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-100 flex gap-2 bg-white">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nhập tin nhắn..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-flower-100"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-9 h-9 bg-flower-100 text-white rounded-full flex items-center justify-center hover:bg-flower-150 transition disabled:opacity-40">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ====================== PRODUCT DROPDOWN ===================================
// Backend là nguồn quyết định toàn bộ: danh sách danh mục, danh mục nào có chủ đề
// (qua themeCount), chủ đề thuộc danh mục nào (qua categoryId), và sản phẩm theo
// categoryId/themeId. Frontend ở đây chỉ hiển thị theo dữ liệu nhận được.
const ProductDropdown = ({ onClose }: { onClose: () => void }) => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<CategoryResponse | null>(null);
  const [themes, setThemes] = useState<ThemeResponse[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState<ThemeResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const navigate = useNavigate();

  // Tải danh sách danh mục khi mở dropdown
  useEffect(() => {
    categoryApi.getAll()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setHoveredCategory(data[0]);
      })
      .catch(() => setCategories([]));
  }, []);

  // Khi đổi danh mục đang hover: nếu danh mục có chủ đề (themeCount > 0, do Backend tính)
  // thì tải các chủ đề thuộc danh mục đó
  useEffect(() => {
    if (!hoveredCategory) return;
    setHoveredTheme(null);
    if (hoveredCategory.themeCount > 0) {
      setLoadingThemes(true);
      themeApi.getAll(hoveredCategory.id)
        .then((data) => {
          setThemes(data);
          setHoveredTheme(data.length > 0 ? data[0] : null);
        })
        .catch(() => setThemes([]))
        .finally(() => setLoadingThemes(false));
    } else {
      setThemes([]);
    }
  }, [hoveredCategory?.id]);

  // Tải sản phẩm: theo chủ đề đang hover nếu có, ngược lại theo danh mục trực tiếp
  useEffect(() => {
    if (!hoveredCategory) return;
    if (hoveredCategory.themeCount > 0 && !hoveredTheme) return; // đang chờ tải chủ đề

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productApi.getAll({
          categoryId: hoveredCategory.id,
          themeId: hoveredTheme?.id,
          pageSize: 4,
          page: 1,
        });
        setProducts(res.items);
      } catch {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [hoveredCategory?.id, hoveredTheme?.id]);

  if (categories.length === 0) return null;

  const viewAllLink = hoveredTheme
    ? `/products?themeId=${hoveredTheme.id}`
    : hoveredCategory
      ? `/products?categoryId=${hoveredCategory.id}`
      : '/products';
  const heading = hoveredTheme?.name || hoveredCategory?.name || '';

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 w-screen max-w-5xl bg-white shadow-xl border-t border-gray-100 z-50 flex rounded-b-xl overflow-hidden"
      style={{ maxHeight: '480px' }}>

      {/* Cột 1 — Danh mục */}
      <div className="w-52 border-r border-gray-100 overflow-y-auto flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onMouseEnter={() => setHoveredCategory(cat)}
            onClick={() => {
              navigate(`/products?categoryId=${cat.id}`);
              onClose();
            }}
            className={`w-full text-left px-5 py-3 text-sm transition flex items-center justify-between
              ${hoveredCategory?.id === cat.id
                ? 'bg-flower-50 text-flower-100 font-medium border-l-2 border-flower-100'
                : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {cat.name}
            {hoveredCategory?.id === cat.id && (
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Cột 2 — Chủ đề: chỉ hiện khi danh mục đang hover có chủ đề (Backend báo qua themeCount) */}
      {hoveredCategory && hoveredCategory.themeCount > 0 && (
        <div className="w-48 border-r border-gray-100 overflow-y-auto flex-shrink-0 bg-gray-50/60">
          {loadingThemes ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-3.5 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            themes.map((theme) => (
              <button
                key={theme.id}
                onMouseEnter={() => setHoveredTheme(theme)}
                onClick={() => {
                  navigate(`/products?themeId=${theme.id}`);
                  onClose();
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition
                  ${hoveredTheme?.id === theme.id
                    ? 'bg-white text-flower-100 font-medium'
                    : 'text-gray-600 hover:bg-white/70'}`}
              >
                {theme.name}
              </button>
            ))
          )}
        </div>
      )}

      {/* Cột 3 — Sản phẩm tiêu biểu */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{heading}</h3>
          <Link
            to={viewAllLink}
            onClick={onClose}
            className="text-sm text-flower-100 hover:underline">
            Xem tất cả →
          </Link>
        </div>

        {loadingProducts ? (
          // Loading skeleton
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-xl mb-2" />
                <div className="h-3 bg-gray-100 rounded mb-1" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                onClick={onClose}
                className="group cursor-pointer">
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2">
                  {p.imageUrl ? (
                    <img src={getImageUrl(p.imageUrl)} alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🧱</div>
                  )}
                </div>
                <p className="text-xs text-gray-700 font-medium line-clamp-2 group-hover:text-flower-100 transition">
                  {p.name}
                </p>
                <p className="text-xs text-flower-100 font-semibold mt-1">
                  {p.price.toLocaleString('vi-VN')}đ
                </p>
                <p className="text-[11px] text-gray-400">
                  {p.stockQuantity > 0 ? `Còn ${p.stockQuantity} sản phẩm` : 'Tạm hết hàng'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-4xl mb-2">🧱</span>
            <p className="text-sm">Chưa có sản phẩm trong danh mục này</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ======================= NAVBAR ====================================
const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin, isSeller, isSupplier } = useAuth();
  const { cartCount, refreshCart } = useCart();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const { wishlistCount, refreshWishlist } = useWishlist();

  const [searchResults, setSearchResults] = useState<ProductResponse[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await productApi.getAll({
          keyword: searchKeyword.trim(),
          page: 1,
          pageSize: 5
        });
        setSearchResults(response.items || []);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchKeyword]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    setCartLoading(true);
    try {
      const res = await cartApi.getCart();
      setCart(res);
    } catch {
      setCart(null);
    } finally {
      setCartLoading(false);
    }
  };

  const handleOpenCart = () => {
    setShowCart(true);
    fetchCart();
  };

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      setShowSearchDropdown(false);
      navigate(`/products?keyword=${searchKeyword}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const handleLogoClick = () => {
    setSearchKeyword('');
    navigate('/');
  };

  useEffect(() => {
    if (location.pathname === '/' && !location.search) {
      setSearchKeyword('');
    }
  }, [location]);

  return (
    <>
      <AnnouncementBar />

      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 grid items-center gap-4"
          style={{ gridTemplateColumns: 'auto 1fr auto' }}>

          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="text-2xl text-flower-100 whitespace-nowrap brand-wordmark">
            3TL-Store
          </button>

          {/* Search bar */}
          <div ref={searchContainerRef} className="w-full px-6 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onFocus={() => {
                    if (searchKeyword.trim()) {
                      setShowSearchDropdown(true);
                    }
                  }}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-flower-100 bg-flower-50"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Dropdown kết quả tìm kiếm */}
            {showSearchDropdown && (
              <div className="absolute left-6 right-6 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-flower-100" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang tìm kiếm...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchKeyword('');
                        }}
                        className="flex items-center gap-4 px-4 py-2.5 hover:bg-flower-50 transition border-b border-gray-50 last:border-0"
                      >
                        {/* Ảnh sản phẩm */}
                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100">
                          {product.imageUrl ? (
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🧱</div>
                          )}
                        </div>

                        {/* Thông tin sản phẩm */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-800 truncate">
                            {product.name}
                          </h4>
                          {product.theme && (
                            <span className="inline-block text-[10px] bg-flower-50 text-flower-100 px-2 py-0.5 rounded-full font-medium mt-0.5">
                              {product.theme}
                            </span>
                          )}
                        </div>

                        {/* Giá */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-flower-100">
                            {product.price.toLocaleString('vi-VN')}đ
                          </p>
                          {product.oldPrice && product.oldPrice > product.price && (
                            <p className="text-xs text-gray-400 line-through">
                              {product.oldPrice.toLocaleString('vi-VN')}đ
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                    <div
                      onClick={() => {
                        setShowSearchDropdown(false);
                        navigate(`/products?keyword=${searchKeyword}`);
                      }}
                      className="text-center py-2 text-xs font-semibold text-flower-100 hover:bg-flower-50 cursor-pointer transition border-t border-gray-100 mt-1"
                    >
                      Xem tất cả kết quả cho "{searchKeyword}"
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Không tìm thấy sản phẩm nào
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Chuông thông báo (giữa ô tìm kiếm và trái tim) */}
            {isAuthenticated && <NotificationBell />}

            <Link to="/wishlist"
              className="p-2 text-gray-500 hover:text-flower-100 transition relative group">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-flower-100 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center group-hover:flex">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/orders"
              className="p-2 text-gray-500 hover:text-flower-100 transition relative group">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>

            <button
              onClick={handleOpenCart}
              className="p-2 text-gray-500 hover:text-flower-100 transition relative">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-flower-100 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Đăng nhập / Avatar dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-full hover:bg-flower-50 transition flex items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-flower-100 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl.startsWith('http')
                          ? user.avatarUrl
                          : `https://localhost:7175${user.avatarUrl}`}
                        alt={user.fullName}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-800 truncate">{user?.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      <span className="text-xs bg-flower-50 text-flower-100 px-2 py-0.5 rounded-full">
                        {user?.role}
                      </span>
                    </div>
                    <Link to="/profile" onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-flower-50 hover:text-flower-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Tài khoản của tôi
                    </Link>
                    <Link to="/orders" onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-flower-50 hover:text-flower-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Đơn hàng của tôi
                    </Link>
                    {(isAdmin || isSeller || isSupplier) && (
                      <Link to="/admin" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-flower-100 hover:bg-flower-50">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Trang quản lý
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (

              <Link to="/login" className="p-2 text-gray-500 hover:text-flower-100 transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom menu */}
        <div className="border-t border-gray-100 relative">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex justify-center items-center gap-1 text-sm font-medium text-gray-600">

              {/* Trang chủ */}
              <li>
                <Link to="/"
                  className="block px-4 py-3 hover:text-flower-100 hover:border-b-2 hover:border-flower-100 transition-all whitespace-nowrap">
                  Trang chủ
                </Link>
              </li>

              {/* Sản phẩm — có dropdown */}
              <li className="relative"
                onMouseEnter={() => setShowProductMenu(true)}
                onMouseLeave={() => setShowProductMenu(false)}>
                <Link to="/products"
                  className="flex items-center gap-1 px-4 py-3 hover:text-flower-100 hover:border-b-2 hover:border-flower-100 transition-all whitespace-nowrap">
                  Sản phẩm
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {/* Dropdown danh mục */}
                {showProductMenu && (
                  <ProductDropdown onClose={() => setShowProductMenu(false)} />
                )}
              </li>

              {[
                { label: 'Best Seller', link: '/best-seller' },
                { label: 'Chương trình', link: '/campaign' },
                { label: 'Khuyến mãi', link: '/vouchers' },
                { label: 'Hỗ trợ', link: '/support' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.link}
                    className={`block px-4 py-3 transition-all whitespace-nowrap ${
                      item.label === 'Chương trình'
                        ? 'hover:text-flower-100'
                        : 'hover:text-flower-100 hover:border-b-2 hover:border-flower-100'
                    }`}>
                    {item.label === 'Chương trình' ? (
                      <span className="relative inline-block px-3 py-1">
                        {/* Vòng elip hồng nghệ thuật bao quanh chữ */}
                        <svg className="absolute inset-0 w-full h-full text-flower-100 overflow-visible pointer-events-none scale-y-135 scale-x-125" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ top: '-1px' }}>
                          <ellipse cx="50" cy="20" rx="48" ry="16" fill="none" stroke="currentColor" strokeWidth="0.4" transform="rotate(-4.5 50 20)" />
                        </svg>
                        <span className="text-flower-100 brand-wordmark">{item.label}</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {showChat && <ChatBox onClose={() => setShowChat(false)} />}

      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-flower-100 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-flower-150 transition z-50"
      >
        {showChat ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

        {/* Overlay */}
{showCart && (
  <div
    className="fixed inset-0 bg-black/40 z-50"
    onClick={() => setShowCart(false)}
  />
)}

{/* Cart Sidebar */}
<div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300
  ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>

  {/* Header */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
    <h3 className="font-bold text-gray-800 text-lg">
      🛒 Giỏ hàng {cart?.items?.length ? `(${cart.items.length})` : ''}
    </h3>
    <button
      onClick={() => setShowCart(false)}
      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  {/* Content */}
  <div className="flex-1 overflow-y-auto px-5 py-4">
    {!isAuthenticated ? (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <span className="text-5xl mb-4">🔐</span>
        <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem giỏ hàng</p>
        <Link to="/login" onClick={() => setShowCart(false)}
          className="px-6 py-2.5 bg-flower-100 text-white rounded-full font-medium hover:bg-flower-150 transition">
          Đăng nhập
        </Link>
      </div>
    ) : cartLoading ? (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    ) : !cart || cart.items.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <span className="text-6xl mb-4">🛒</span>
        <p className="text-gray-600 mb-2 font-medium">Giỏ hàng trống</p>
        <p className="text-sm text-gray-400 mb-4">Hãy thêm sản phẩm vào giỏ hàng</p>
        <Link to="/products" onClick={() => setShowCart(false)}
          className="px-6 py-2.5 bg-flower-100 text-white rounded-full font-medium hover:bg-flower-150 transition">
          Khám phá sản phẩm
        </Link>
      </div>
    ) : (
      <div className="space-y-4">
        {cart.items.map(item => (
          <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">

            {/* Ảnh */}
            <Link to={`/products/${item.productId}`}
              onClick={() => setShowCart(false)}
              className="w-20 h-20 flex-shrink-0 bg-flower-50 rounded-xl overflow-hidden">
              <img
                src={getImageUrl(item.productImage)}
                alt={item.productName}
                className="w-full h-full object-contain p-1"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </Link>

            {/* Thông tin */}
            <div className="flex-1 min-w-0">
              <Link to={`/products/${item.productId}`}
                onClick={() => setShowCart(false)}
                className="text-sm font-medium text-gray-800 hover:text-flower-100 transition line-clamp-2">
                {item.productName}
              </Link>

              <p className="text-flower-100 font-bold text-sm mt-1">
                {item.price.toLocaleString('vi-VN')}đ
              </p>

              {/* Số lượng + xóa */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={async () => {
                      if (item.quantity <= 1) return;
                      try {
                        const res = await cartApi.updateQuantity(item.id, item.quantity - 1);
                        setCart(res);
                        refreshCart();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Có lỗi xảy ra');
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-flower-50 transition text-sm disabled:opacity-30"
                    disabled={item.quantity <= 1}>
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={async () => {
                      try {
                        const res = await cartApi.updateQuantity(item.id, item.quantity + 1);
                        setCart(res);
                        refreshCart();
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Có lỗi xảy ra');
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-flower-50 transition text-sm">
                    +
                  </button>
                </div>

                <button
                  onClick={async () => {
                    const res = await cartApi.removeItem(item.id);
                    setCart(res);
                    refreshCart();
                  }}
                  className="text-gray-400 hover:text-red-500 transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Footer — Tổng tiền + nút */}
  {isAuthenticated && cart && cart.items.length > 0 && (
    <div className="border-t border-gray-100 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-sm">Tạm tính</span>
        <span className="font-bold text-gray-800">
          {cart.total.toLocaleString('vi-VN')}đ
        </span>
      </div>
      {cart.total >= 500000 && (
        <p className="text-xs text-green-500">✓ Đơn hàng được miễn phí vận chuyển</p>
      )}
      <Link
        to="/cart"
        onClick={() => setShowCart(false)}
        className="block w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition text-center">
        Xem giỏ hàng & Thanh toán
      </Link>
      <button
        onClick={() => setShowCart(false)}
        className="block w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm text-center">
        Tiếp tục mua sắm
      </button>
    </div>
  )}
</div>

    </>
  );
};

export default Navbar;