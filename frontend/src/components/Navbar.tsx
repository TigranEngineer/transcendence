import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { toast } from 'react-toastify';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [searchUsername, setSearchUsername] = useState('');


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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername) {
      navigate(`/profile/${searchUsername}`);
    }
  };

  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between">
      <div>
        <Link to="/" className="text-xl font-bold">ft_transcendence</Link>
      </div>
      {token ? (
        <div className="space-x-4 flex items-center">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Search username..."
              className="p-1 rounded-l text-black"
            />
            <button type="submit" className="bg-white text-blue-600 p-1 rounded-r">Search</button>
          </form>
          <Link to="/profile" className="hover:underline">Profile</Link>
          <Link to="/chat" className="hover:underline">Chat</Link>
          <button onClick={handleLogout} className="hover:underline">Logout</button>
        </div>
      ) : (
      <div>
        <Link to="/login" className="mr-4 hover:underline">Login</Link>
        <Link to="/register" className="hover:underline">Register</Link>
      </div>
      )
        }
    </nav >
  );
};

export default Navbar;