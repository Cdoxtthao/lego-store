import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi, CategoryResponse } from '../api/categoryApi';
import { ProductResponse } from '../types';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/imageHelper';

const heroBanners = [
  {
    title: 'Bộ sưu tập đặc biệt',
    subtitle: 'Bộ sưu tập cầu thủ huyền thoại',
    script: 'Messi • CR7 • Mbappé • Vini Jr',  
    cta: 'Xem sản phẩm',
    link: '/products',
    image: '/images/banners/1.jpg',
    bgColor: 'from-green-100 to-white',
    dark: false,
  },
  {
    title: 'Khám phá thế giới đồ chơi',
    subtitle: 'Hàng ngàn sản phẩm chính hãng',
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
    link: '/products',
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
      <Link to={banner.link} className="max-w-7xl mx-auto px-10 flex items-center justify-between block cursor-pointer"
        style={{ minHeight: '420px', textDecoration: 'none' }}>

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
          <span
            className="inline-flex items-center gap-2 px-8 py-3 bg-flower-100 text-white font-semibold rounded-full hover:bg-flower-150 transition text-base shadow-md hover:shadow-lg animate-bounce-subtle">
            {banner.cta}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
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
      </Link>

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
// Danh mục được lấy thật từ Backend (GET /api/categories) — không hardcode tên danh mục.
// Ảnh đại diện vẫn chọn cứng trong code (ảnh của một sản phẩm bất kỳ thuộc danh mục đó),
// vì Category.ImageUrl trong DB hiện chưa có file ảnh thật tương ứng.
const categoryImageMap: Record<string, string> = {
  'Star Wars': '/images/products/TIE-Interceptor-1.png',
  'Technic': '/images/products/Bugatti-Centodieci-1.png',
  'One Piece': '/images/products/Baratie-Restaurant-1.png',
  'Pokemon': '/images/products/Venusaur-Charizard-Blastoise-1.png',
  'Ninjago': '/images/products/The-Temple-Bounty-1.png',
  'Harry Potter': '/images/products/Dumbledores-Office-1.png',
  'Icons': '/images/products/Grand-Piano-1.png',
  'Super Mario': '/images/products/Mario-Kart-1.png',
  'Disney': '/images/products/Pua-1.png',
  'Jurassic World': '/images/products/T-Rex-1.png',
  'Sports': '/images/products/Messi-1.png',
  'Botanicals': '/images/products/Black-Dahlia-Flower-1.png',
  'Ideas': '/images/products/Great-Deku-Tree-1.png',
  'Creator': '/images/products/Celestial-Pagoda-1.png',
};

// 3 danh mục hot cố định: lego (ảnh 1), robot (ảnh 2), gấu bông (ảnh 3) — ảnh lấy từ images/verdes
const HOT_CATEGORIES = [
  { keys: ['lego'], label: 'Lego', img: '/images/verdes/2.png' },
  { keys: ['robot'], label: 'Robot', img: '/images/verdes/3.png' },
  { keys: ['gấu bông', 'gau bong', 'gấu', 'stuffed', 'snuffed', 'teddy', 'plush'], label: 'Gấu bông', img: '/images/verdes/1.png' },
];

const CategorySection = ({ categories }: { categories: CategoryResponse[] }) => {
  if (categories.length === 0) return null;

  // Chọn đúng 3 danh mục hot theo thứ tự lego → robot → gấu bông
  const hot = HOT_CATEGORIES
    .map(h => {
      const cat = categories.find(c => h.keys.some(k => c.name.toLowerCase().includes(k)));
      return cat ? { cat, img: h.img, label: h.label } : null;
    })
    .filter((x): x is { cat: CategoryResponse; img: string; label: string } => x !== null);

  if (hot.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">Danh Mục HOT</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {hot.map(({ cat, img }) => {
          const image = img;
          return (
            <Link key={cat.id} to={`/products?categoryId=${cat.id}`}
              className="relative rounded-2xl overflow-hidden group cursor-pointer bg-flower-50"
              style={{ aspectRatio: '3/4' }}>

              {/* Ảnh nền */}
              {image ? (
                <img
                  src={getImageUrl(image)}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    // Ảnh verdes chưa có (vd 3.png) -> fallback ảnh sản phẩm của danh mục hoặc ẩn
                    const fb = cat.imageUrl ? getImageUrl(cat.imageUrl) : '';
                    if (fb && e.currentTarget.src !== fb) { e.currentTarget.src = fb; }
                    else { e.currentTarget.style.display = 'none'; }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🧱</div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Số lượng sản phẩm — góc trên */}
              <span className="absolute top-3 left-3 bg-flower-100 text-white text-xs font-bold px-3 py-1 rounded-full">
                {cat.productCount} sản phẩm
              </span>

              {/* Nút mũi tên góc dưới phải */}
              <div className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md group-hover:bg-flower-100 group-hover:text-white transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Tên danh mục dưới cùng */}
              <div className="absolute bottom-3 left-3 right-12 text-white font-bold text-lg truncate">
                {cat.name}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

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
        <Link to={link} className={`w-72 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${bannerBg} relative hover:shadow-xl block`}
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
        </Link>

        {/* Sản phẩm */}
        <div className="flex-1 grid grid-cols-3 gap-4" >
          {visible.map(p => (
            <ProductCard key={p.id} product={p} />
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
  { label: '6-10\nTUỔI', range: '6-10', color: 'from-blue-400 to-blue-500', emoji: '🍼' },
  { label: '10-12\nTUỔI', range: '10-12', color: 'from-green-400 to-green-500', emoji: '🧸' },
  { label: '12-14\nTUỔI', range: '12-14', color: 'from-orange-400 to-orange-500', emoji: '🤖' },
  { label: '14-18\nTUỔI', range: '14-18', color: 'from-purple-400 to-purple-500', emoji: '🎮' },
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
    desc: 'Khám phá hàng trăm sản phẩm mới nhất vừa ra mắt trong năm 2026.',
    cta: 'Khám phá',
    link: '/products?sortBy=newest',
    bg: 'bg-amber-800',
    image: '/images/banners/5.jpg',
  },
  {
    title: 'Góc sáng tạo',
    desc: 'Chia sẻ hình ảnh và bài viết, cùng khám phá cảm hứng từ cộng đồng.',
    cta: 'Tìm hiểu',
    link: '/creative',
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



// Helper to interleave products by category to avoid adjacent same-category items
const interleaveProducts = (products: ProductResponse[], randomize: boolean): ProductResponse[] => {
  const groups: Record<number, ProductResponse[]> = {};
  products.forEach(p => {
    const catId = p.categoryId || 0;
    if (!groups[catId]) {
      groups[catId] = [];
    }
    groups[catId].push(p);
  });

  if (randomize) {
    Object.keys(groups).forEach(key => {
      const arr = groups[Number(key)];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    });
  }

  let catIds = Object.keys(groups).map(Number);
  if (randomize) {
    for (let i = catIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [catIds[i], catIds[j]] = [catIds[j], catIds[i]];
    }
  } else {
    catIds.sort((a, b) => a - b);
  }

  const result: ProductResponse[] = [];
  const maxLen = Math.max(...Object.values(groups).map(g => g.length), 0);

  for (let i = 0; i < maxLen; i++) {
    for (const catId of catIds) {
      if (groups[catId] && i < groups[catId].length) {
        result.push(groups[catId][i]);
      }
    }
  }

  return result;
};

// ========== HOMEPAGE ==========
const HomePage = () => {
  const [featured, setFeatured] = useState<ProductResponse[]>([]);
  const [newest, setNewest] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestSeller, setBestSeller] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newestRes, bestSellerRes, categoriesRes] = await Promise.all([
          productApi.getFeatured(40),
          productApi.getAll({ sortBy: 'newest', pageSize: 40, page: 1 }),
          productApi.getAll({ sortBy: 'bestseller', pageSize: 12, page: 1 }), // bán chạy nhất — tính theo đơn hàng thực tế ở Backend
          categoryApi.getAll(), // danh mục thật của shop, kèm số lượng sản phẩm mỗi danh mục
        ]);
        
        const interleavedFeatured = interleaveProducts(featuredRes, false).slice(0, 8);
        const interleavedNewest = interleaveProducts(newestRes.items, true).slice(0, 8);

        setFeatured(interleavedFeatured);
        setNewest(interleavedNewest);
        setBestSeller(bestSellerRes.items);
        setCategories(categoriesRes);
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
      <CategorySection categories={categories} />

      {!loading && bestSeller.length > 0 && (
        <ProductSection
          title="Sản Phẩm Bán Chạy Nhất"
          link="/products?sortBy=bestseller"
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
