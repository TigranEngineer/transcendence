import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login, verify2FA } from '../services/api';
import { LoginRequest } from '../types/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [code, setCode] = useState('');//
  const [requires2FA, setRequires2FA] = useState(false);//
  const [message, setMessage] = useState('');//

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(formData);
      // localStorage.setItem('token', response.token);
      // localStorage.setItem('id', response.user.id.toString());
      // toast.success('Login successful');
      // navigate('/profile');
      ///////////
      if (response.requires2FA) {
        setRequires2FA(true);
      } else {
        localStorage.setItem('token', response.token!);
        localStorage.setItem('id', response.user!.id.toString());
        toast.success('Login successful');
        navigate('/profile');
      }
      ////////////////
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };
////////////////
  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await verify2FA(code);
      localStorage.setItem('token', response.token!);
      localStorage.setItem('id', response.user!.id.toString());
      toast.success('2FA verification successful');
      navigate('/profile');
    } catch (error: any) {
      setMessage(error.response?.data?.error || '2FA verification failed');
      toast.error(error.response?.data?.error || '2FA verification failed');
    }
  };
//////////////
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
//         <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
//           Login
//         </h2>
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
//               Email
//             </label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
//               required
//             />
//           </div>
//           <div className="mb-6">
//             <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
//               Password
//             </label>
//             <input
//               type="password"
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
//               required
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-xl"
//           >
//             Login
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };
return (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
      <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
        Login
      </h2>
      {!requires2FA ? (
        <form onSubmit={handleSubmit}>
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
            Login
          </button>
        </form>
      ) : (
        <form onSubmit={handle2FAVerify}>
          <div className="mb-4">
            <label htmlFor="code" className="block text-gray-700 mb-2 font-medium">
              2FA Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            Verify 2FA
          </button>
        </form>
      )}
      {message && <p className="mt-2 text-red-500">{message}</p>}
    </div>
  </div>
);
};

export default Login;