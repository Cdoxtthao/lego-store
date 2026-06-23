import { useState } from 'react';
import { Link } from 'react-router-dom';

// ========== FAQ DATA ==========
const faqData = [
  {
    category: '🛒 Đặt hàng',
    questions: [
      {
        q: 'Làm thế nào để đặt hàng?',
        a: 'Bạn chọn sản phẩm → Thêm vào giỏ hàng → Tiến hành thanh toán → Điền thông tin giao hàng → Xác nhận đặt hàng. Đơn hàng sẽ được xử lý trong vòng 24 giờ.'
      },
      {
        q: 'Tôi có thể thay đổi hoặc hủy đơn hàng không?',
        a: 'Bạn có thể hủy đơn hàng khi đơn đang ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận". Vào mục Tài khoản → Đơn hàng của tôi → Hủy đơn.'
      },
      {
        q: 'Tôi có thể mua hàng mà không cần đăng ký tài khoản không?',
        a: 'Hiện tại bạn cần đăng ký tài khoản để đặt hàng. Việc này giúp bạn theo dõi đơn hàng và nhận ưu đãi thành viên dễ dàng hơn.'
      },
    ]
  },
  {
    category: '🚚 Vận chuyển',
    questions: [
      {
        q: 'Thời gian giao hàng là bao lâu?',
        a: 'Nội thành TP.HCM và Hà Nội: 1-2 ngày làm việc. Các tỉnh thành khác: 3-5 ngày làm việc.'
      },
      {
        q: 'Phí vận chuyển được tính như thế nào?',
        a: 'Miễn phí vận chuyển cho đơn hàng từ 500.000đ. Đơn dưới 500.000đ phí ship 30.000đ.'
      },
      {
        q: 'Tôi có thể theo dõi đơn hàng không?',
        a: 'Có. Vào Tài khoản → Đơn hàng của tôi để xem trạng thái đơn hàng theo thời gian thực.'
      },
    ]
  },
  {
    category: '💳 Thanh toán',
    questions: [
      {
        q: 'Có những hình thức thanh toán nào?',
        a: 'Chúng tôi hỗ trợ: COD (thanh toán khi nhận hàng), MoMo, ZaloPay. Sẽ bổ sung thêm các hình thức khác trong thời gian tới.'
      },
      {
        q: 'Thanh toán online có an toàn không?',
        a: 'Hoàn toàn an toàn. Chúng tôi sử dụng các cổng thanh toán uy tín và mã hóa SSL để bảo vệ thông tin của bạn.'
      },
      {
        q: 'Tôi có thể yêu cầu xuất hóa đơn VAT không?',
        a: 'Có. Vui lòng liên hệ với chúng tôi qua email hoặc hotline sau khi đặt hàng để được hỗ trợ xuất hóa đơn VAT.'
      },
    ]
  },
  {
    category: '🔄 Đổi trả',
    questions: [
      {
        q: 'Chính sách đổi trả như thế nào?',
        a: 'Chúng tôi chấp nhận đổi trả trong vòng 30 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi từ nhà sản xuất, sai sản phẩm hoặc hư hỏng trong quá trình vận chuyển.'
      },
      {
        q: 'Quy trình đổi trả như thế nào?',
        a: '1. Liên hệ hotline hoặc email để thông báo. 2. Cung cấp ảnh/video sản phẩm lỗi. 3. Chúng tôi sắp xếp thu hồi và gửi hàng mới trong 3-5 ngày.'
      },
      {
        q: 'Tôi có được hoàn tiền không?',
        a: 'Có. Nếu sản phẩm không còn hàng để đổi, chúng tôi sẽ hoàn tiền 100% trong vòng 5-7 ngày làm việc.'
      },
    ]
  },
  {
    category: '🏆 Sản phẩm',
    questions: [
      {
        q: 'Sản phẩm có chính hãng không?',
        a: 'Tất cả sản phẩm tại 3TL-Store đều là hàng chính hãng, được nhập khẩu trực tiếp và có đầy đủ tem nhãn chính hãng.'
      },
      {
        q: 'Sản phẩm có bảo hành không?',
        a: 'Sản phẩm được bảo hành theo chính sách của nhà sản xuất. Nếu sản phẩm bị thiếu chi tiết hoặc lỗi từ nhà sản xuất, bạn có thể liên hệ 3TL-Store để được hỗ trợ.'
      },
    ]
  },
];

// ========== FAQ ITEM ==========
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition
      ${open ? 'border-flower-100' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
        <span className={`text-sm font-medium ${open ? 'text-flower-100' : 'text-gray-800'}`}>
          {question}
        </span>
        <svg
          className={`h-5 w-5 flex-shrink-0 ml-3 transition-transform ${open ? 'rotate-180 text-flower-100' : 'text-gray-400'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-flower-50">
          {answer}
        </div>
      )}
    </div>
  );
};

// ========== SUPPORT PAGE ==========
const SupportPage = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSending(true);
    // Giả lập gửi form
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setSending(false);
    setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="bg-white min-h-screen">

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-flower-50 to-white py-12 px-6 text-center border-b border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Trung tâm Hỗ trợ</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Chúng tôi luôn sẵn sàng hỗ trợ bạn. Tìm câu trả lời nhanh trong FAQ
          hoặc liên hệ trực tiếp với đội ngũ của chúng tôi.
        </p>

        {/* Quick contact */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <a href="tel:0362071148"
            className="flex items-center gap-2 text-sm text-flower-100 hover:underline">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            0362071148
          </a>
          <span className="text-gray-300">|</span>
          <a href="mailto:uno22516@gmail.com"
            className="flex items-center gap-2 text-sm text-flower-100 hover:underline">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            uno22516@gmail.com
          </a>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            8:00 - 22:00 hàng ngày
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-3 gap-10">

          {/* LEFT — FAQ */}
          <div className="col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              ❓ Câu hỏi thường gặp
            </h2>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {faqData.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCategory(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition
                    ${activeCategory === i
                      ? 'bg-flower-100 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-flower-50 hover:text-flower-100'}`}>
                  {cat.category}
                </button>
              ))}
            </div>

            {/* FAQ list */}
            <div className="space-y-3">
              {faqData[activeCategory].questions.map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>

            {/* Không tìm thấy */}
            <div className="mt-8 p-5 bg-flower-50 rounded-2xl text-center">
              <p className="text-gray-600 text-sm mb-2">
                Không tìm thấy câu trả lời bạn cần?
              </p>
              <p className="text-gray-500 text-xs">
                Hãy liên hệ trực tiếp với chúng tôi qua form bên phải hoặc hotline
              </p>
            </div>
          </div>

          {/* RIGHT — Liên hệ + Thông tin */}
          <div className="col-span-1 space-y-6">

            {/* Thông tin liên hệ */}
            <div className="bg-flower-50 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">📞 Liên hệ với chúng tôi</h3>
              <div className="space-y-3">
                {[
                  { icon: '📍', label: 'Địa chỉ', value: '26 Nguyễn Thái Học, Phường Vĩnh Yên, tỉnh Phú Thọ' },
                  { icon: '📞', label: 'Hotline', value: '0362071148' },
                  { icon: '📧', label: 'Email', value: 'uno22516@gmail.com' },
                  { icon: '⏰', label: 'Giờ làm việc', value: '8:00 - 22:00 (Tất cả các ngày)' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm text-gray-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form liên hệ */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">✉️ Gửi tin nhắn</h3>

              {sent ? (
                <div className="text-center py-6">
                  <span className="text-4xl block mb-3">✅</span>
                  <p className="font-medium text-gray-800 mb-1">Gửi thành công!</p>
                  <p className="text-sm text-gray-500">
                    Chúng tôi sẽ phản hồi trong vòng 24 giờ
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Họ và tên *"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="Email *"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Số điện thoại"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
                    />
                  </div>
                  <div>
                    <select
                      value={contactForm.subject}
                      onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 text-gray-500">
                      <option value="">Chủ đề</option>
                      <option value="order">Vấn đề về đơn hàng</option>
                      <option value="product">Vấn đề về sản phẩm</option>
                      <option value="payment">Vấn đề về thanh toán</option>
                      <option value="return">Đổi trả hàng</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <textarea
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Nội dung tin nhắn *"
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !contactForm.name || !contactForm.email || !contactForm.message}
                    className="w-full py-3 bg-flower-100 text-white font-semibold rounded-xl hover:bg-flower-150 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Gửi tin nhắn
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Chính sách nhanh */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">📋 Chính sách</h3>
              <div className="space-y-2">
                {[
                  { label: 'Chính sách đổi trả', icon: '🔄' },
                  { label: 'Chính sách vận chuyển', icon: '🚚' },
                  { label: 'Chính sách bảo mật', icon: '🔒' },
                  { label: 'Điều khoản dịch vụ', icon: '📄' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => setActiveCategory(
                      faqData.findIndex(f => f.category.includes('Đổi trả') ||
                        f.category.includes('Vận chuyển'))
                    )}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-flower-50 transition text-left">
                    <span>{item.icon}</span>
                    <span className="text-sm text-gray-600 hover:text-flower-100 transition">
                      {item.label}
                    </span>
                    <svg className="h-4 w-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
