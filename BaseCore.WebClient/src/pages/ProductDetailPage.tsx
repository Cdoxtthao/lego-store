import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { ProductResponse } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { reviewApi } from '../api/reviewApi';
import { ReviewResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { cartApi } from '../api/cartApi';
import { useCart } from '../context/CartContext'; 
import WishlistButton from '../components/WishlistButton';
import axiosClient from '../api/axiosClient';

// ========== IMAGE GALLERY ==========
const ImageGallery = ({ product }: { product: ProductResponse }) => {
  const images = product.images?.length > 0
    ? product.images
    : [{ id: 0, imageUrl: product.imageUrl || '', isMain: true, sortOrder: 0 }];

  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="flex flex-col gap-4">

      {/* Ảnh lớn */}
      <div
        className="relative bg-flower-50 rounded-2xl overflow-hidden cursor-zoom-in"
        style={{ aspectRatio: '1' }}
        onClick={() => setZoomed(true)}
      >
        <img
          src={getImageUrl(images[selected]?.imageUrl)}
          alt={product.name}
          className="w-full h-full object-contain p-6 transition duration-300"
        />

        {/* Badge giảm giá */}
        {product.discountPercent && (
          <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            -{product.discountPercent}%
          </span>
        )}

        {/* Hint zoom */}
        <div className="absolute bottom-3 right-3 bg-white/80 rounded-full p-1.5 text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {/* Thumbnails bên dưới */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition
                ${i === selected
                  ? 'border-flower-100 shadow-md'
                  : 'border-gray-200 hover:border-flower-100'}`}
            >
              <img
                src={getImageUrl(img.imageUrl)}
                alt={`${product.name} ${i + 1}`}
                className="w-full h-full object-contain p-1 bg-flower-50"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal zoom ảnh */}
      {zoomed && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-3xl w-full">
            <img
              src={getImageUrl(images[selected]?.imageUrl)}
              alt={product.name}
              className="w-full object-contain rounded-2xl max-h-screen"
            />
            <button
              onClick={() => setZoomed(false)}
              className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Prev/Next trong modal */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelected(p => Math.max(0, p - 1)); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelected(p => Math.min(images.length - 1, p + 1)); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== PRODUCT DETAIL PAGE ==========
const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [maxWarning, setMaxWarning] = useState(false);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedTotal, setRelatedTotal] = useState(0);
  const relatedPageSize = 8;
  const { refreshCart } = useCart();
  const [canReview, setCanReview] = useState(false);

  const reviewRef = useRef<HTMLDivElement>(null);
  const scrollToReview = () => {
    reviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [productRes, reviewRes, canReviewRes] = await Promise.all([
          productApi.getById(Number(id)),
          reviewApi.getByProduct(Number(id)),
          isAuthenticated
            ? axiosClient.get(`/Reviews/can-review/${id}`)
                .catch(() => ({ data: { canReview: false } }))
            : Promise.resolve({ data: { canReview: false } }),
        ]);
        setProduct(productRes);
        setReviews(reviewRes);
        setCanReview(canReviewRes.data.canReview);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, isAuthenticated]); 

  useEffect(() => {
    if (!product) return;
    const fetchRelated = async () => {
      const res = await productApi.getAll({
        theme: product.theme || undefined,
        pageSize: relatedPageSize,
        page: relatedPage,
      });
      setRelatedProducts(res.items.filter(p => p.id !== Number(id)));
      setRelatedTotal(res.totalCount);
      relatedRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    fetchRelated();
  }, [relatedPage]);

  const relatedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await productApi.getById(Number(id));
        setProduct(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await cartApi.addToCart(product?.id ?? 0, quantity);
      setAddedToCart(true);
      refreshCart();
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } 
  };

  const handleSubmitReview = async () => {
    if (myRating === 0) { setReviewError('Vui lòng chọn số sao'); return; }
    setSubmitting(true);
    try {
      await reviewApi.create({
        productId: Number(id),
        rating: myRating,
        comment: myComment,
      });
      setReviewSuccess(true);
      setMyRating(0);
      setMyComment('');
      // Reload reviews
      const newReviews = await reviewApi.getByProduct(Number(id));
      setReviews(newReviews);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setReviewError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setReviewError(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-2 gap-12 animate-pulse">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-6 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-4/5" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <span className="text-6xl mb-4">😢</span>
      <p className="text-lg">Không tìm thấy sản phẩm</p>
      <Link to="/products" className="mt-4 text-flower-100 hover:underline">
        Quay lại danh sách
      </Link>
    </div>
  );

  const handleQuantityChange = (val: number) => {
    if (val < 1) return;
    if (val > product.stockQuantity) { 
      setQuantity(product.stockQuantity);
      setMaxWarning(true);
      setTimeout(() => setMaxWarning(false), 3000);
    } else {
      setQuantity(val);
      setMaxWarning(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-flower-100">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-flower-100">Sản phẩm</Link>
          <span>/</span>
          {product.categoryName && (
            <>
              <Link to={`/products?theme=${product.theme}`}
                className="hover:text-flower-100">{product.categoryName}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-2 gap-12">

          {/* Trái — Gallery */}
          <ImageGallery product={product} />

          {/* Phải — Thông tin */}
          <div>

            {/* Category + Set number */}
            <div className="flex items-center gap-3 mb-3">
              {product.categoryName && (
                <span className="text-xs font-semibold text-flower-100 uppercase tracking-wider bg-flower-50 px-3 py-1 rounded-full">
                  {product.categoryName}
                </span>
              )}
              {product.setNumber && (
                <span className="text-xs text-gray-400">#{product.setNumber}</span>
              )}
            </div>

            {/* Tên sản phẩm */}
            <h1 className="text-3xl font-bold text-gray-800 mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Thanh thông tin — Rating, Review, Sold, Tố cáo */}
            <div className="flex items-center justify-between py-3 border-y border-gray-100 mb-4">

              {/* Bên trái — Rating + Review + Sold */}
              <div className="flex items-center gap-0">

                {/* Rating */}
                <button
                  onClick={scrollToReview}
                  className="flex items-center gap-1.5 pr-4 hover:opacity-70 transition group">
                  <span className="text-flower-100 font-semibold text-sm underline underline-offset-2">
                    {product.averageRating > 0 ? product.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i}
                        className={`h-3.5 w-3.5 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                        fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </button>

                {/* Divider */}
                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* Số đánh giá */}
                <button
                  onClick={scrollToReview}
                  className="flex items-center gap-1 px-4 hover:opacity-70 transition">
                  <span className="text-sm font-semibold text-gray-700 underline underline-offset-2">
                    {product.reviewCount}
                  </span>
                  <span className="text-sm text-gray-500">Đánh Giá</span>
                </button>

                {/* Divider */}
                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* Đã bán */}
                <div className="flex items-center gap-1 px-4">
                  <span className="text-sm text-gray-500">Đã Bán</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {product.soldCount}
                  </span>
                </div>
              </div>

              {/* Bên phải — Tố cáo */}
              <button
                onClick={() => setShowReportModal(true)}
                className="text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Tố cáo
              </button>
            </div>

            {/* Modal tố cáo */}
            {showReportModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setShowReportModal(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                  onClick={(e) => e.stopPropagation()}>

                  {reportSubmitted ? (
                    <div className="text-center py-6">
                      <span className="text-4xl mb-3 block">✅</span>
                      <h3 className="font-bold text-gray-800 mb-2">Đã gửi báo cáo!</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Cảm ơn bạn đã phản ánh. Chúng tôi sẽ xem xét trong thời gian sớm nhất.
                      </p>
                      <button
                        onClick={() => { setShowReportModal(false); setReportSubmitted(false); }}
                        className="px-6 py-2 bg-flower-100 text-white rounded-full text-sm">
                        Đóng
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800 text-lg">Tố cáo sản phẩm</h3>
                        <button onClick={() => setShowReportModal(false)}
                          className="text-gray-400 hover:text-gray-600">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <p className="text-sm text-gray-500 mb-4">Chọn lý do tố cáo:</p>

                      <div className="space-y-2 mb-5">
                        {[
                          'Sản phẩm giả/nhái',
                          'Thông tin sản phẩm sai lệch',
                          'Hình ảnh không đúng thực tế',
                          'Giá bán bất thường',
                          'Vi phạm bản quyền',
                          'Nội dung không phù hợp',
                          'Lý do khác',
                        ].map(reason => (
                          <label key={reason}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-flower-50 transition">
                            <input
                              type="radio"
                              name="reportReason"
                              value={reason}
                              checked={reportReason === reason}
                              onChange={() => setReportReason(reason)}
                              className="accent-flower-100"
                            />
                            <span className="text-sm text-gray-700">{reason}</span>
                          </label>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          if (!reportReason) return;
                          setReportSubmitted(true);
                        }}
                        disabled={!reportReason}
                        className="w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition disabled:opacity-40">
                        Gửi báo cáo
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i}
                      className={`h-4 w-4 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                      fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {product.averageRating.toFixed(1)} ({product.reviewCount} đánh giá)
                </span>
              </div>
            )}

            {/* Giá */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-flower-100">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
              {product.oldPrice && (
                <div className="flex flex-col">
                  <span className="text-lg text-gray-400 line-through">
                    {product.oldPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-sm text-red-500 font-medium">
                    Tiết kiệm {(product.oldPrice - product.price).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>

            {/* Mô tả ngắn */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* Thông tin nhanh */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {product.pieceCount && (
                <div className="bg-flower-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-flower-100">{product.pieceCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Mảnh ghép</p>
                </div>
              )}
              {product.ageRange && (
                <div className="bg-flower-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-flower-100">{product.ageRange}</p>
                  <p className="text-xs text-gray-500 mt-1">Độ tuổi</p>
                </div>
              )}
              {product.theme && (
                <div className="bg-flower-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-flower-100 leading-tight">{product.theme}</p>
                  <p className="text-xs text-gray-500 mt-1">Chủ đề</p>
                </div>
              )}
            </div>

            {/* Số lượng — ẩn khi hết hàng */}
            {product.stockQuantity === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-center">
                <p className="text-red-500 font-semibold">😢 Sản phẩm tạm hết hàng</p>
                <p className="text-xs text-red-400 mt-1">Vui lòng quay lại sau</p>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">

                    {/* Nút giảm */}
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-flower-50 transition disabled:opacity-30">
                      −
                    </button>

                    {/* Input nhập tay */}
                    <input
                      type="number"
                      min={1}
                      max={product.stockQuantity}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 h-10 text-center font-semibold border-x border-gray-200 focus:outline-none focus:bg-flower-50 text-sm"
                    />

                    {/* Nút tăng */}
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stockQuantity}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-flower-50 transition disabled:opacity-30">
                      +
                    </button>
                  </div>

                  <span className="text-xs text-gray-400">
                    Còn <span className="font-semibold text-gray-600">{product.stockQuantity}</span> sản phẩm
                  </span>
                </div>

                {/* Thông báo đạt tối đa */}
                {maxWarning && (
                  <p className="mt-2 text-sm text-orange-500 flex items-center gap-1">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Số lượng bạn chọn đã đạt mức tối đa của sản phẩm này
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0 || addedToCart}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition
                ${product.stockQuantity === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : addedToCart
                  ? 'bg-green-500'
                  : 'bg-flower-100 hover:bg-flower-150'}
                disabled:opacity-50 disabled:cursor-not-allowed`}>
              {product.stockQuantity === 0
                ? 'Hết hàng'
                : addedToCart
                ? '✓ Đã thêm vào giỏ!'
                : 'Thêm vào giỏ hàng'}
              </button>
              <WishlistButton productId={product.id} size="md" />
            </div>

            {/* Cam kết */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              {[
                { icon: '🚚', text: 'Miễn phí vận chuyển cho đơn từ 5.000.000đ' },
                { icon: '✅', text: 'Hàng chính hãng LEGO 100%' },
                { icon: '🔄', text: 'Đổi trả trong 30 ngày' },
                { icon: '🎁', text: 'Đóng gói quà tặng miễn phí' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Tab thông tin thêm */}
        <div ref={reviewRef} className="mt-16 border-t border-gray-100 pt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Thông tin chi tiết</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tên sản phẩm', value: product.name },
              { label: 'Mã set', value: product.setNumber },
              { label: 'Chủ đề', value: product.theme },
              { label: 'Danh mục', value: product.categoryName },
              { label: 'Số mảnh', value: product.pieceCount ? `${product.pieceCount} mảnh` : null },
              { label: 'Độ tuổi', value: product.ageRange },
            ].filter(item => item.value).map(item => (
              <div key={item.label}
                className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========== ĐÁNH GIÁ SẢN PHẨM ========== */}
        <div className="mt-16 border-t border-gray-100 pt-10">

          {/* Tổng quan đánh giá — kiểu Shopee */}
          <div className="flex items-center gap-12 bg-flower-50 rounded-2xl p-8 mb-10">

            {/* Điểm trung bình */}
            <div className="text-center flex-shrink-0">
              <p className="text-6xl font-bold text-flower-100">
                {product.averageRating > 0 ? product.averageRating.toFixed(1) : '0.0'}
              </p>
              <div className="flex justify-center gap-0.5 my-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i}
                    className={`h-5 w-5 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-500">{product.reviewCount} đánh giá</p>
            </div>

            {/* Thanh rating */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => r.rating === star).length;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 flex-shrink-0">
                      <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-600">{star}</span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Số lượt mua */}
            <div className="text-center flex-shrink-0 border-l border-gray-200 pl-12">
              <p className="text-4xl font-bold text-gray-800">
                {product.stockQuantity > 0 ? '🔥' : '😢'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {product.stockQuantity > 0 ? `Còn ${product.stockQuantity} sp` : 'Hết hàng'}
              </p>
            </div>
          </div>

  {/* Danh sách đánh giá */}
  <h3 className="text-lg font-bold text-gray-800 mb-4">
    Tất cả đánh giá ({reviews.length})
  </h3>

  {reviews.length === 0 ? (
    <div className="text-center py-12 text-gray-400">
      <span className="text-4xl mb-3 block">💬</span>
      <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
    </div>
  ) : (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition">
          <div className="flex items-start gap-4">

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-flower-100 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {review.userName?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              {/* Tên + sao + ngày */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-800">{review.userName}</span>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i}
                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      {/* ========== SẢN PHẨM TƯƠNG TỰ ========== */}
<div ref={relatedRef} className="mt-16 border-t border-gray-100 pt-10">
  <h2 className="text-2xl font-bold text-gray-800 mb-6">
    Sản phẩm tương tự
  </h2>

  {relatedProducts.length === 0 ? (
    <div className="text-center py-12 text-gray-400">
      <span className="text-4xl mb-3 block">🧱</span>
      <p>Không có sản phẩm tương tự</p>
    </div>
  ) : (
    <>
      {/* Grid sản phẩm */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {relatedProducts.map(p => (
          <Link
            key={p.id}
            to={`/products/${p.id}`}
            onClick={() => {
              setRelatedPage(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition flex flex-col">

            {/* Ảnh */}
            <div className="relative bg-flower-50 p-3" style={{ aspectRatio: '1', width: '100%' }}>
              {p.discountPercent && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
                  -{p.discountPercent}%
                </span>
              )}
              <img
                src={getImageUrl(p.imageUrl)}
                alt={p.name}
                className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            {/* Thông tin */}
            <div className="p-3 flex flex-col flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {p.categoryName}
              </p>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-flower-100 transition line-clamp-2 flex-1 mb-2">
                {p.name}
              </p>

              {/* Rating nhỏ */}
              {p.reviewCount > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs text-gray-400">
                    {p.averageRating.toFixed(1)} ({p.reviewCount})
                  </span>
                </div>
              )}

              {/* Giá */}
              <div className="flex items-center gap-2">
                <span className="text-flower-100 font-bold text-sm">
                  {p.price.toLocaleString('vi-VN')}đ
                </span>
                {p.oldPrice && (
                  <span className="text-gray-400 text-xs line-through">
                    {p.oldPrice.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Phân trang */}
      {relatedTotal > relatedPageSize && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setRelatedPage(p => Math.max(1, p - 1))}
            disabled={relatedPage === 1}
            className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Số trang */}
          {Array.from(
            { length: Math.ceil(relatedTotal / relatedPageSize) },
            (_, i) => i + 1
          ).map(p => (
            <button
              key={p}
              onClick={() => setRelatedPage(p)}
              className={`w-9 h-9 border rounded-lg text-sm transition
                ${p === relatedPage
                  ? 'bg-flower-100 text-white border-flower-100'
                  : 'border-gray-300 hover:border-flower-100 hover:text-flower-100'}`}>
              {p}
            </button>
          ))}

          <button
            onClick={() => setRelatedPage(p => Math.min(Math.ceil(relatedTotal / relatedPageSize), p + 1))}
            disabled={relatedPage === Math.ceil(relatedTotal / relatedPageSize)}
            className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:border-flower-100 hover:text-flower-100 transition disabled:opacity-30">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </>
  )}
</div>

      </div>
    </div>
  );
};

export default ProductDetailPage;
