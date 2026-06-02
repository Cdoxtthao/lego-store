import { Link } from 'react-router-dom';
import { useState } from 'react';

const paymentMethods = [
  { name: 'Visa', img: 'https://cdn.simpleicons.org/visa/1A1F71' },
  { name: 'Mastercard', img: 'https://cdn.simpleicons.org/mastercard' },
  { name: 'PayPal', img: 'https://cdn.simpleicons.org/paypal/003087' },
  { name: 'Google Pay', img: 'https://cdn.simpleicons.org/googlepay' },
  { name: 'Apple Pay', img: 'https://cdn.simpleicons.org/applepay/000000' },
  { name: 'American Express', img: 'https://cdn.simpleicons.org/americanexpress/007BC1' },
];

const Footer = () => {

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleNewsletter = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    // Ẩn thông báo sau 4 giây
    setTimeout(() => setNewsletterSuccess(false), 4000);
};

  return (
    <footer className="bg-flower-50 text-gray-300 mt-16">

      {/* Newsletter section */}
      <div className="py-12 px-6 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Đăng ký nhận thông tin:
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Là người đầu tiên biết về bộ sưu tập mới và ưu đãi độc quyền!
        </p>

        {newsletterSuccess ? (
          // Thông báo cảm ơn
          <div className="flex items-center justify-center gap-2 text-flower-100 font-medium animate-pulse">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Cảm ơn bạn đã đăng ký! Chúng tôi sẽ gửi thông tin sớm nhất. 💌
          </div>
        ) : (
          <form
            onSubmit={handleNewsletter}
            className="flex items-center max-w-md mx-auto border-b border-gray-400 pb-1"
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="flex-1 bg-transparent text-gray-600 text-sm focus:outline-none placeholder-gray-400"
            />
            <button
              type="submit"
              className="text-gray-500 hover:text-flower-100 transition ml-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        )}
      </div>

      {/* Top section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Cột 1 — Logo + giới thiệu */}
          <div className="col-span-1">
            <Link to="/" className="text-2xl font-bold text-flower-100"
              style={{ fontFamily: 'Georgia, serif' }}>
              BrickDo
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Cửa hàng LEGO chính hãng tại Việt Nam. Hàng ngàn sản phẩm đa dạng, giao hàng toàn quốc, cam kết chính hãng 100%.
            </p>

            {/* Social media */}
            <div className="flex gap-3 mt-5">
              {/* Facebook */}
              <a href="https://web.facebook.com/crash.cong" target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-flower-100 transition">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/cdodangiu.eghnav/" target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-flower-100 transition">
                <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
              {/* Youtube */}
              <a href="https://www.youtube.com/@congdo5293" target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-flower-100 transition">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58a2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                  <polygon fill="#111827" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@congdo208" target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-flower-100 transition">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Cột 2 — Sản phẩm */}
          <div>
            <h3 className="text-black font-semibold text-lg uppercase tracking-wider mb-4">
              Sản phẩm
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                { label: 'Tất cả sản phẩm', link: '/products' },
                { label: 'Sản phẩm nổi bật', link: '/products?isFeatured=true' },
                { label: 'Hàng mới về', link: '/products?sortBy=newest' },
                { label: 'Khuyến mãi', link: '/products?sortBy=price_asc' },
                { label: 'LEGO Technic', link: '/products?theme=Technic' },
                { label: 'LEGO Star Wars', link: '/products?theme=Star+Wars' },
                { label: 'LEGO Ninjago', link: '/products?theme=Ninjago' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.link}
                    className="hover:text-flower-100 transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3 — Hỗ trợ */}
          <div>
            <h3 className="text-black font-semibold text-lg uppercase tracking-wider mb-4">
              Hỗ trợ
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                { label: 'Hướng dẫn mua hàng', link: '/support' },
                { label: 'Chính sách đổi trả', link: '/support' },
                { label: 'Chính sách vận chuyển', link: '/support' },
                { label: 'Câu hỏi thường gặp', link: '/support' },
                { label: 'Liên hệ tư vấn', link: '/support' },
                { label: 'Điều khoản dịch vụ', link: '/terms' },
                { label: 'Chính sách bảo mật', link: '/privacy' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.link}
                    className="hover:text-flower-100 transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4 — Liên hệ + Bản đồ */}
          <div>
            <h3 className="text-black font-semibold text-lg uppercase tracking-wider mb-4">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 text-flower-100 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400">26 Nguyễn Thái Học, Phường Vĩnh Yên, tỉnh Phú Thọ</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-flower-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:0362071148" className="text-gray-400 hover:text-flower-100 transition">
                  0362071148
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-flower-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:support@legostore.vn"
                  className="text-gray-400 hover:text-flower-100 transition">
                  uno22516@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-flower-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400">8:00 - 22:00 (Tất cả các ngày)</span>
              </li>
            </ul>

            {/* Phương thức thanh toán */}
            <div className="mt-6">
              <p className="text-black text-xs font-semibold uppercase tracking-wider mb-3">
                Thanh toán
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                {paymentMethods.map(p => (
                  <div key={p.name}
                    className="bg-white rounded-md p-1.5 h-9 w-14 flex items-center justify-center shadow-sm">
                    <img src={p.img} alt={p.name} className="h-5 w-full object-contain" />
                  </div>
                ))}

                </div>
              </div>

              </div>
            </div>
          </div>


      {/* Bottom bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 LEGO Store Vietnam. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-flower-100 transition">Điều khoản</Link>
            <Link to="/privacy" className="hover:text-flower-100 transition">Bảo mật</Link>
            <Link to="/support" className="hover:text-flower-100 transition">Hỗ trợ</Link>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;