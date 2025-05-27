import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login, verify2FA } from '../services/api';
import { LoginRequest, LoginResponse } from '../types/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [twoFACode, setTwoFACode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: LoginResponse = await login(formData);
      if ('twoFARequired' in response && response.twoFARequired) {
        setShow2FA(true);
        setUserId(response.userId);
      } else {
        const authResponse = response as { token: string; user: { id: number; username: string; email: string } };
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('id', authResponse.user.id.toString());
        toast.success('Login successful');
        navigate('/profile');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('User ID not found');
      return;
    }
    try {
      const response = await verify2FA({ userId, code: twoFACode });
      localStorage.setItem('token', response.token);
      localStorage.setItem('id', response.user.id.toString());
      toast.success('2FA verification successful');
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid 2FA code');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Login</h2>
        {!show2FA ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:outline-none"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit}>
            <div className="mb-4">
              <label htmlFor="twoFACode" className="block text-gray-700 mb-2">2FA Code</label>
              <input
                type="text"
                id="twoFACode"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none"
                placeholder="Enter 6-digit code"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Verify 2FA
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
