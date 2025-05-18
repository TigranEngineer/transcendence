import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../services/api';
import { RegisterRequest } from '../types/auth';

const Register: React.FC = () => {
  console.log('flan');
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
  });

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
      toast.success('Registration successful');
      navigate('/profile');
    } catch (error: any) {
      console.error('Registration failed in component:', error.response?.data || error.message); // Debug log
      toast.error(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;