import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { motion } from "framer-motion";
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // xác nhận mật khẩu
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Error
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const navigate = useNavigate();

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const { login } = useAuth();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    let valid = true;
    if (!fullName) { setFullNameError('Vui lòng điền vào mục này.'); valid = false; }
    if (!email) { setEmailError('Vui lòng điền vào mục này.'); valid = false; }
    if (!password) { setPasswordError('Vui lòng điền vào mục này.'); valid = false; }
    else if (password.length < 6) { setPasswordError('Mật khẩu phải có ít nhất 6 ký tự.'); valid = false; }
    if (!confirmPassword) { setConfirmPasswordError('Vui lòng điền vào mục này.'); valid = false; }
    else if (password !== confirmPassword) { setConfirmPasswordError('Mật khẩu xác nhận không khớp.'); valid = false; }
    if (!valid) return;

    setError('');
    setLoading(true);

    try {
      await authApi.register({ fullName, email, password, phoneNumber, address });
      const loginResponse = await authApi.login({ email, password });
      login(loginResponse);

      if (['Admin', 'Seller', 'Supplier'].includes(loginResponse.role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = fullName && email && password && confirmPassword;

  return (
    <div className="min-h-screen bg-flower-50 flex flex-col">

      {/* Logo */}
      <div className="text-center pt-10 pb-4">
        <Link to="/">
          <h1 className="text-4xl font-bold text-flower-100"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '2px' }}>
            BrickDO
          </h1>
        </Link>
      </div>

      {/* Form giữa màn hình */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0}}
          // exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Tạo tài khoản</h2>
          <p className="text-gray-500 text-sm mb-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-flower-100 hover:underline transition-all duration-200">
              Đăng nhập
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Họ tên */}
            <div className="mb-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (e.target.value) setFullNameError(''); }}
                onBlur={() => { if (!fullName) setFullNameError('Vui lòng điền vào mục này.'); }}
                placeholder="Họ và tên"
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2
                  ${fullNameError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-flower-100'}`}
              />
              {fullNameError && <p className="text-red-500 text-sm mt-1">{fullNameError}</p>}
            </div>

            {/* Email */}
            <div className="mb-3">
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (e.target.value) setEmailError(''); setError(''); }}
                onBlur={() => { if (!email) setEmailError('Vui lòng điền vào mục này.'); }}
                placeholder="Email"
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2
                  ${emailError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-flower-100'}`}
              />
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (e.target.value) setPasswordError(''); }}
                  onBlur={() => {
                    if (!password) setPasswordError('Vui lòng điền vào mục này.');
                    else if (password.length < 6) setPasswordError('Mật khẩu phải có ít nhất 6 ký tự.');
                  }}
                  placeholder="Mật khẩu"
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 pr-12
                    ${passwordError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-flower-100'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-flower-100">
                  <EyeIcon show={showPassword} />
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (e.target.value) setConfirmPasswordError(''); }}
                  onBlur={() => {
                    if (!confirmPassword) setConfirmPasswordError('Vui lòng điền vào mục này.');
                    else if (password !== confirmPassword) setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
                  }}
                  placeholder="Xác nhận mật khẩu"
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 pr-12
                    ${confirmPasswordError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-flower-100'}`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-flower-100">
                  <EyeIcon show={showConfirmPassword} />
                </button>
              </div>
              {confirmPasswordError && <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>}
            </div>

            {/* Số điện thoại — không bắt buộc */}
            <div className="mb-3">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Số điện thoại (không bắt buộc)"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-flower-100"
              />
            </div>

            {/* Địa chỉ — không bắt buộc */}
            <div className="mb-4">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Địa chỉ (không bắt buộc)"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-flower-100"
              />
            </div>

            {/* Lỗi chung */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}

            {/* Thành công */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full py-3 font-semibold rounded-lg transition text-white
                ${(!isFormValid || loading)
                  ? 'bg-flower-100 opacity-40 cursor-not-allowed'
                  : 'bg-flower-100 hover:bg-flower-150 cursor-pointer'}`}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

          </form>
        </motion.div>
      </div>

      {/* Điều khoản */}
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

export default RegisterPage;