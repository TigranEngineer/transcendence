import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';



const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [searchUsername, setSearchUsername] = useState('');
  
  const { t, i18n } = useTranslation();
  
  const LanguageSwitcher = () => (
    <div className="flex gap-2">
      <button onClick={() => i18n.changeLanguage('en')} aria-label="Switch to English">🇺🇸</button>
      <button onClick={() => i18n.changeLanguage('fr')} aria-label="Switch to French">🇫🇷</button>
      <button onClick={() => i18n.changeLanguage('ru')} aria-label="Switch to Russian">🇷🇺</button>
    </div>
  );


  const handleLogout = async () => {
    try {
      if (token) await logout();
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchUsername.trim();
    if (trimmed) {
      navigate(`/profile/${trimmed}`);
    }
    setSearchUsername('');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 animate-fade-in">
      <div>
        <Link to="/" className="text-2xl font-extrabold tracking-wide hover:text-gray-200 transition duration-300">
          ft_transcendence
        </Link>
        <LanguageSwitcher />
      </div>

      {token ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="p-2 rounded-l-md text-black w-full sm:w-auto focus:outline-none"
              aria-label="Search username"
            />
            <button
              type="submit"
              className="bg-white text-blue-600 font-semibold px-4 rounded-r-md hover:bg-gray-100 transition-all duration-300"
            >
              {t('searchButton')}
            </button>
          </form>
          <Link
            to="/2fa"
            className="hover:text-gray-200 transition duration-300 font-medium"
          >
            TwoFactorAuth
          </Link>
          <Link
            to="/profile"
            className="hover:text-gray-200 transition duration-300 font-medium"
          >
            {t('profile')}
          </Link>
          {/* <Link
            to="/chat"
            className="hover:text-gray-200 transition duration-300 font-medium"
          >
            Chat
          </Link> */}
          <button
            onClick={handleLogout}
            className="hover:text-gray-200 transition duration-300 font-medium"
          >
             {t('logout')}
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link
            to="/google-login"
            className="hover:text-gray-200 transition duration-300 font-medium"
          >
            GoogleLogin
          </Link>
          <Link to="/login" className="hover:text-gray-200 transition duration-300 font-medium">
          {t('login')}
          </Link>
          <Link to="/register" className="hover:text-gray-200 transition duration-300 font-medium">
          {t('register')}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
