import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../services/api';
import { LoginRequest, AuthResponse } from '../types/auth';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { t, i18n } = useTranslation();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleTwoFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwoFactorCode(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const response: AuthResponse = await login({ ...formData, twoFactorCode: show2FA ? twoFactorCode : undefined });
      localStorage.setItem('token', response.token);
      localStorage.setItem('id', response.user.id.toString());
      if (response.twoFactorEnabled) {
        localStorage.setItem('twoFactorEnabled', 'true');
      } else {
        localStorage.removeItem('twoFactorEnabled');
      }
      toast.success('Login successful');
      navigate('/profile');
    } catch (error: any) {
      if (error.response?.data?.error === 'Two-factor authentication code required') {
        setShow2FA(true);
        toast.info('Enter your 2FA code');
      } else {
        toast.error(error.response?.data?.error || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">{t('login')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">{t('email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.email ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              required
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">{t('password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.password ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              required
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          {show2FA && (
            <div className="mb-6">
              <label htmlFor="twoFactorCode" className="block text-gray-700 mb-2 font-medium">{t('two_f')}</label>
              <input
                type="text"
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={handleTwoFactorChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                maxLength={6}
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;