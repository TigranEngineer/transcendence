import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { toast } from 'react-toastify';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">ft_transcendence</Link>
        <div>
          {token ? (
            <>
              <Link to="/profile" className="mr-4 hover:underline">Profile</Link>
              <button onClick={handleLogout} className="hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mr-4 hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;