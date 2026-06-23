import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = () => {
    if (!email) setEmailError('Vui lòng điền vào mục này.');
    else setEmailError('');
  };

  const validatePassword = () => {
    if (!password) setPasswordError('Vui lòng điền vào mục này.');
    else setPasswordError('');
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    let valid = true;
    if (!email) { setEmailError('Vui lòng điền vào mục này.'); valid = false; }
    if (!password) { setPasswordError('Vui lòng điền vào mục này.'); valid = false; }
    if (!valid) return;

    setError('');
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      login(response);
      if (rememberMe) localStorage.setItem('rememberedEmail', email);
      else localStorage.removeItem('rememberedEmail');
      if (['Admin', 'Seller', 'Supplier'].includes(response.role)) navigate('/admin');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-flower-50 flex flex-col">

      {/* Logo + tên thương hiệu ở trên đầu */}
      <div className="text-center pt-10 pb-6">
        <Link to="/">
          <h1 className="text-4xl text-flower-100 brand-wordmark">
              3TL-Store
          </h1>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0}}
          // exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
        >

          <Link to="/" className="inline-flex items-center gap-1 text-sm text-flower-100 hover:text-flower-150 transition mb-4">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang chủ
          </Link>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">
            Đăng nhập hoặc{' '}
            <Link to="/register" className="text-flower-100 hover:underline transition-all duration-200">
              tạo tài khoản
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value) setEmailError('');
                    setError('');
                  }}
                  onBlur={validateEmail}
                  placeholder="Email"
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 pr-12
                    ${emailError
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-gray-300 focus:ring-flower-100'}`}
                />
              </div>
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            {/* Password */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) setPasswordError('');
                    setError('');
                  }}
                  onBlur={validatePassword}
                  placeholder="Mật khẩu"
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 pr-12
                    ${passwordError
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-gray-300 focus:ring-flower-100'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-flower-100"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>

            {/* Lưu đăng nhập */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-flower-100 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 cursor-pointer">
                Lưu đăng nhập
              </label>
            </div>

            {/* Lỗi */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={`w-full py-3 font-semibold rounded-lg transition text-white
                ${(!email || !password || loading)
                  ? 'bg-flower-100 opacity-40 cursor-not-allowed'
                  : 'bg-flower-100 hover:bg-flower-150 cursor-pointer'}`}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Điều khoản ở cuối trang */}
      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Bằng cách tiếp tục, bạn đồng ý với{' '}
          <a href="/terms" className="text-flower-100 hover:underline">Điều khoản dịch vụ</a>
          {' '}và{' '}
          <a href="/privacy" className="text-flower-100 hover:underline">Chính sách bảo mật</a>
          {' '}của chúng tôi.
        </p>
      </div>

    </div>
  );
};

export default LoginPage;