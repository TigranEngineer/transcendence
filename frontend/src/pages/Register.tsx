import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register, setup2FA } from '../services/api';
import { RegisterRequest } from '../types/auth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
  });

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [message, setMessage] = useState('');
  console.log('Register component rendered'); // Debug log

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input changed:', e.target.name, e.target.value); // Debug log
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, calling register with:', formData); // Debug log
    console.log('Register function:', register); // Debug log to verify the function
    try {
      const response = await register(formData);
      console.log('Registration successful:', response); // Debug log
      localStorage.setItem('token', response.token);
      localStorage.setItem('id', response.user.id.toString());
      setQrCodeUrl(response.qrCodeUrl || '');
      setMessage('Registration successful. Scan the QR code to set up 2FA.');
      toast.success('Registration successful');
      navigate(`/profile/${localStorage.getItem('id')}`);
    } catch (error: any) {
      console.error('Registration failed in component:', error.response?.data || error.message); // Debug log
      toast.error(error.response?.data?.error || 'Registration failed');
    }
  };

  const handle2FASetup = async () => {
    try {
      await setup2FA(formData.email, formData.password);
      setQrCodeUrl('');
      setMessage('2FA enabled successfully');
      toast.success('2FA enabled successfully');
      navigate(`/profile/${localStorage.getItem('id')}`);
    } catch (error: any) {
      console.error('2FA setup failed:', error.response?.data || error.message); // Debug log
      setMessage(error.response?.data?.error || '2FA setup failed');
      toast.error(error.response?.data?.error || '2FA setup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
          Register
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 mb-2 font-medium">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            Register
          </button>
        </form>
        {qrCodeUrl && (
          <div className="mt-4">
            <p className="text-gray-600 mb-2">Scan this QR code with an authenticator app:</p>
            <img src={qrCodeUrl} alt="2FA QR Code" className="my-2" />
            <button
              onClick={handle2FASetup}
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              Enable 2FA
            </button>
          </div>
        )}
        {message && <p className="mt-2 text-red-500">{message}</p>}
      </div>
    </div>
  );
};

export default Register;