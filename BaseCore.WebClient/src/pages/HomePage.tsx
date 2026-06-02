import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { ProductResponse } from '../types';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/imageHelper';

// ========== HERO BANNER ==========
const heroBanners = [
  {
    title: 'LEGO® Editions',
    subtitle: 'Bộ sưu tập cầu thủ huyền thoại',
    script: 'Messi • CR7 • Mbappé • Vini Jr',  
    cta: 'Xem sản phẩm',
    link: '/products?theme=Sports',
    image: '/images/banners/1.jpg',
    bgColor: 'from-green-100 to-white',
    dark: false,
  },
  {
    title: 'Khám phá thế giới LEGO',
    subtitle: 'Hàng ngàn bộ LEGO chính hãng',
    script: 'Giao hàng toàn quốc • Chính hãng 100%',
    cta: 'Mua ngay',
    link: '/products',
    image: '/images/products/Celestial-Pagoda-1.png',
    bgColor: 'from-flower-50 to-white',
    dark: false,
  },
  {
    title: 'TIE Interceptor',
    subtitle: 'Phi thuyền huyền thoại Star Wars',
    script: 'Bộ sưu tập Star Wars™ mới nhất',
    cta: 'Khám phá ngay',
    link: '/products?theme=Star+Wars',
    image: '/images/products/TIE-Interceptor-1.png',
    bgColor: 'from-slate-200 to-white',
    dark: false,
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % heroBanners.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = heroBanners[current];

  return (
    <div className={`bg-gradient-to-r ${banner.bgColor} transition-colors duration-700 overflow-hidden`}
      style={{ minHeight: '420px' }}>
      <div className="max-w-7xl mx-auto px-10 flex items-center justify-between"
        style={{ minHeight: '420px' }}>

        {/* Bên trái — Nội dung */}
        <div className="flex-1 py-12 z-10"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>

          {/* Script nhỏ phía trên */}
          <p className="text-sm font-medium text-flower-100 tracking-widest uppercase mb-3">
            {banner.script}
          </p>

          {/* Tiêu đề */}
          <h1 className="text-5xl font-bold text-gray-800 mb-3 leading-tight">
            {banner.title}
          </h1>

          {/* Phụ đề */}
          <p className="text-xl text-gray-500 mb-8">
            {banner.subtitle}
          </p>

          {/* Nút CTA */}
          <Link to={banner.link}
            className="inline-flex items-center gap-2 px-8 py-3 bg-flower-100 text-white font-semibold rounded-full hover:bg-flower-150 transition text-base shadow-md hover:shadow-lg">
            {banner.cta}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Bên phải — Ảnh với hiệu ứng mờ trái → phải */}
        <div className="flex-1 flex justify-end items-center relative"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.4s ease',
            minHeight: '420px',
          }}>

          {/* Gradient mờ từ trái sang phải — che phần trái của ảnh */}
          <div className="absolute left-0 top-0 bottom-0 w-48 z-10"
            style={{
              background: `linear-gradient(to right, ${getBgColor(banner.bgColor)}, transparent)`,
            }}
          />

          <img
            src={`https://localhost:7175${banner.image}`}
            alt={banner.title}
            className="h-80 object-contain relative z-0"
            style={{ maxWidth: '480px' }}
          />
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-5">
        {heroBanners.map((_, i) => (
          <button key={i} onClick={() => { setCurrent(i); setVisible(true); }}
            className={`h-2 rounded-full transition-all duration-300
              ${i === current ? 'w-6 bg-flower-100' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

// Helper lấy màu nền để gradient khớp
function getBgColor(bgClass: string): string {
  if (bgClass.includes('green')) return 'rgb(240, 253, 244)';
  if (bgClass.includes('flower')) return 'rgb(255, 240, 240)';
  if (bgClass.includes('slate')) return 'rgb(226, 232, 240)';
  return 'white';
}
// ========== DANH MỤC NỔI BẬT ==========
const featuredCategories = [
  { name: 'Thể thao', emoji: '⚽', theme: 'Sports', image: '/images/products/Messi-1.png', tag: 'Slay' },
  { name: 'Monkie Kid', emoji: '🐒', theme: 'Monkie+Kid', image: '/images/products/Monkey-King-Ultra-Mech-1.png', tag: 'Epic' },
  { name: 'Pokemon', emoji: '⚡', theme: 'Pokemon', image: '/images/products/Pikachu-1.png', tag: 'Cute' },
  { name: 'Technic', emoji: '⚙️', theme: 'Technic', image: '/images/products/Bugatti-Centodieci-1.png', tag: 'Power' },
];

const CategorySection = () => (
  <section className="max-w-7xl mx-auto px-6 py-12">
    <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">Danh Mục HOT</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {featuredCategories.map((cat) => (
        <Link key={cat.name} to={`/products?theme=${cat.theme}`}
          className="relative rounded-2xl overflow-hidden group cursor-pointer"
          style={{ aspectRatio: '3/4' }}>

          {/* Ảnh nền */}
          <img
            src={`https://localhost:7175${cat.image}`}
            alt={cat.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Tag góc trên */}
          <span className="absolute top-3 left-3 bg-flower-100 text-white text-xs font-bold px-3 py-1 rounded-full">
            {cat.tag}
          </span>

          {/* Nút mũi tên góc dưới phải */}
          <div className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md group-hover:bg-flower-100 group-hover:text-white transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Tên danh mục dưới cùng */}
          <div className="absolute bottom-3 left-3 text-white font-bold text-lg">
            {cat.name}
          </div>
        </Link>
      ))}
    </div>
  </section>
);

// ========== PROMO BANNER + SẢN PHẨM  ==========
const ProductSection = ({
  title,
  link,
  products,
  bannerImage,
  bannerBg = 'from-pink-400 to-purple-500',
}: {
  title: string;
  link: string;
  products: ProductResponse[];
  bannerImage?: string;
  bannerBg?: string;
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3; // hiện 3 sản phẩm cùng lúc

  const goPrev = () => setStartIndex(prev => Math.max(0, prev - 1));
  const goNext = () => setStartIndex(prev =>
    Math.min(products.length - visibleCount, prev + 1)
  );

  const visible = products.slice(startIndex, startIndex + visibleCount);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">

      {/* Tiêu đề + nút Xem thêm */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">{title}</h1>
        <Link to={link}
          className="inline-flex items-center gap-2 px-6 py-2 border-2 border-flower-100 text-flower-100 font-semibold rounded-full hover:bg-flower-100 hover:text-white transition text-sm">
          Xem Thêm
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </Link>
      </div>

      {/* Grid — banner trái + sản phẩm phải */}
      <div className="flex items-stretch gap-4 relative">

        {/* Mũi tên trái */}
        <button
          onClick={goPrev}
          disabled={startIndex === 0}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border-2 border-flower-100 text-flower-100 rounded-full flex items-center justify-center shadow-md hover:bg-flower-100 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Banner trái */}
        <div className={`w-72 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${bannerBg} relative hover:shadow-xl`}
          style={{ minHeight: '480px' }}>
          {bannerImage ? (
            <img
              src={`https://localhost:7175${bannerImage}`}
              alt={title}
              className="w-full h-full object-contain object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl p-6">
              🧱
            </div>
          )}
        </div>

        {/* Sản phẩm */}
        <div className="flex-1 grid grid-cols-3 gap-4" >
          {visible.map(p => (
            <div key={p.id}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition">

              {/* Ảnh */}
              <Link to={`/products/${p.id}`} className="relative bg-flower-50 p-3"
                style={{ aspectRatio: '1' }}>
                {p.discountPercent && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
                    -{p.discountPercent}%
                  </span>
                )}
                <img
                  src={getImageUrl(p.imageUrl)}
                  alt={p.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </Link>

              {/* Thông tin */}
              <div className="p-3 flex flex-col flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  {p.categoryName} · {p.setNumber}
                </p>
                <Link to={`/products/${p.id}`}
                  className="text-sm font-medium text-gray-700 hover:text-flower-100 transition line-clamp-2 flex-1">
                  {p.name}
                </Link>

                {/* Giá */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-flower-100 font-bold text-base">
                    {p.price.toLocaleString('vi-VN')}đ
                  </span>
                  {p.oldPrice && (
                    <span className="text-gray-400 text-xs line-through">
                      {p.oldPrice.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>

                {/* Nút thêm vào giỏ + yêu thích */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-flower-100 text-white text-sm font-semibold py-2 rounded-lg hover:bg-flower-150 transition">
                    Thêm Vào Giỏ
                  </button>
                  <button className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-flower-100 hover:border-flower-100 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mũi tên phải */}
        <button
          onClick={goNext}
          disabled={startIndex >= products.length - visibleCount}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border-2 border-flower-100 text-flower-100 rounded-full flex items-center justify-center shadow-md hover:bg-flower-100 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </section>
  );
};

// ========== ĐỘ TUỔI ==========
const ageRanges = [
  { label: '6-10\nTUỔI', range: '8+', color: 'from-blue-400 to-blue-500', emoji: '🍼' },
  { label: '10-12\nTUỔI', range: '10+', color: 'from-green-400 to-green-500', emoji: '🧸' },
  { label: '12-14\nTUỔI', range: '12+', color: 'from-orange-400 to-orange-500', emoji: '🤖' },
  { label: '14-18\nTUỔI', range: '14+', color: 'from-purple-400 to-purple-500', emoji: '🎮' },
  { label: '18+\nTUỔI', range: '18+', color: 'from-pink-400 to-pink-500', emoji: '🚀' },
];

const AgeSection = () => (
  <section className="max-w-7xl mx-auto px-6 py-12">
    <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Độ Tuổi</h1>
    <div className="flex justify-center gap-6 flex-wrap">
      {ageRanges.map((age) => (
        <Link key={age.label} to={`/products?ageRange=${age.range}`}
          className="group flex flex-col items-center gap-3">

          {/* Circle */}
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${age.color} flex flex-col items-center justify-center shadow-lg group-hover:scale-110 transition duration-300 relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-4 text-white text-lg">⭐</div>
              <div className="absolute top-3 right-3 text-white text-sm">✨</div>
              <div className="absolute bottom-3 left-3 text-white text-sm">🌟</div>
            </div>

            {/* Text */}
            <div className="text-center z-10">
              {age.label.split('\n').map((line, i) => (
                <p key={i} className={`text-white font-extrabold leading-tight ${i === 0 ? 'text-2xl' : 'text-sm tracking-wider'}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

// ========== KHÁM PHÁ THÊM ==========
const discoverItems = [
  {
    title: 'Bộ sưu tập mới nhất',
    desc: 'Khám phá hàng trăm bộ LEGO mới nhất vừa ra mắt trong năm 2026.',
    cta: 'Khám phá',
    link: '/products?sortBy=newest',
    bg: 'bg-amber-800',
    image: '/images/banners/5.jpg',
  },
  {
    title: 'Góc sáng tạo LEGO',
    desc: 'Xem thư viện ý tưởng lắp ráp và cảm hứng từ cộng đồng LEGO.',
    cta: 'Tìm hiểu',
    link: '/',
    bg: 'bg-sky-500',
    image: '/images/banners/4.jpg',
  },
  {
    title: 'Ưu đãi thành viên',
    desc: 'Đăng ký thành viên để nhận điểm thưởng và mở khóa ưu đãi độc quyền.',
    cta: 'Tham gia ngay',
    link: '/register',
    bg: 'bg-purple-700',
    image: '/images/banners/3.jpg',
  },
];

const DiscoverSection = () => (
  <section className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100">
    <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">Khám phá thêm</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {discoverItems.map((item) => (
        <div key={item.title} className={`${item.bg} rounded-2xl overflow-hidden relative`}
          style={{ minHeight: '320px' }}>

          {/* Ảnh */}
          <img
            src={`https://localhost:7175${item.image}`}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />

          {/* Nội dung */}
          <div className="relative z-10 p-6 flex flex-col justify-between h-full"
            style={{ minHeight: '320px' }}>
            <div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{item.desc}</p>
            </div>
            <Link to={item.link}
              className="mt-6 inline-block border-2 border-white text-white font-semibold px-6 py-2 rounded-full hover:bg-white hover:text-gray-800 transition w-fit">
              {item.cta}
            </Link>
          </div>
        </div>
      ))}
    </div>
  </section>
);



// ========== HOMEPAGE ==========
const HomePage = () => {
  const [featured, setFeatured] = useState<ProductResponse[]>([]);
  const [newest, setNewest] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestSeller, setBestSeller] = useState<ProductResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newestRes, bestSellerRes] = await Promise.all([
          productApi.getFeatured(8),
          productApi.getAll({ sortBy: 'newest', pageSize: 8, page: 1 }),
          productApi.getAll({ isFeatured: true, pageSize: 12, page: 1 }), // best seller
        ]);
        setFeatured(featuredRes);
        setNewest(newestRes.items);
        setBestSeller(bestSellerRes.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <HeroBanner />
      <CategorySection />

      {!loading && bestSeller.length > 0 && (
        <ProductSection
          title="Sản Phẩm Bán Chạy Nhất"
          link="/products?isFeatured=true"
          products={bestSeller}
          bannerImage="/images/banners/3.webp"
          bannerBg="from-yellow-300 to-orange-400"
        />
      )}

      {/* Sản phẩm nổi bật */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800"> Sản Phẩm Nổi Bật</h1>
          <div className="flex justify-center mb-4 mt-4">
            <Link
              to="/products?isFeatured=true"
              className="flex items-center gap-2 px-6 py-2 border-2 border-flower-100 text-flower-100 font-semibold rounded-full hover:bg-flower-100 hover:text-white transition text-sm"
            >
              Xem Thêm
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-2xl mb-3" />
                <div className="h-4 bg-gray-100 rounded mb-2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Sản phẩm mới nhất */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Sản Phẩm Mới Nhất</h1>
          <div className="flex justify-center mb-4 mt-4">
            <Link
              to="/products?isFeatured=true"
              className="flex items-center gap-2 px-6 py-2 border-2 border-flower-100 text-flower-100 font-semibold rounded-full hover:bg-flower-100 hover:text-white transition text-sm"
            >
              Xem Thêm
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newest.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <AgeSection />
      <DiscoverSection />

    </div>
  );
};

export default HomePage;