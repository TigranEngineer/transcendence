import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUser, getUserByUsername, addFriend, blockUser } from '../services/api';
import { UserResponse } from '../types/auth';
import { useTranslation } from 'react-i18next';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<string>('');
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !id) {
        toast.error(t('login_error'));
        navigate('/Profile');
        return;
      }

      try {
        if (username) {
          const userData = await getUserByUsername(token, username);
          setUser(userData);
        } else {
          const userData = await getUser(token, id);
          setUser(userData);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || t('fetch_error'));
        navigate('/Profile');
      }
    };

    fetchUser();
  }, [navigate, token, id, username, t]);

  const openAI = () => navigate('/ai');
  const openPVP = () => navigate('/pvp');

  const handleAddFriend = async () => {
    if (id && token && user && user.id !== parseInt(id)) {
      const result = await addFriend(id, user.id, token);
      setStatus(result.success ? t('friend_added') : `${t('error')}: ${result.error}`);
    }
  };

  const handleBlockUser = async () => {
    if (id && token && user && user.id !== parseInt(id)) {
      const result = await blockUser(id, user.id, token);
      setStatus(result.success ? t('user_blocked') : `${t('error')}: ${result.error}`);
    }
  };

  const LanguageSwitcher = () => (
    <div className="flex justify-center mb-4 gap-2">
      <button onClick={() => i18n.changeLanguage('en')}>🇺🇸</button>
      <button onClick={() => i18n.changeLanguage('fr')}>🇫🇷</button>
      <button onClick={() => i18n.changeLanguage('ru')}>🇷🇺</button>
    </div>
  );

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <LanguageSwitcher />

      <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center animate-fade-in">
        {t('profile')}
      </h2>

      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto animate-fade-in">
        <img
          src={user.profilePhoto || 'https://via.placeholder.com/150'}
          alt={`${user.username}'s profile`}
          className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-blue-300 shadow-md"
        />
        <div className="text-center text-gray-800 space-y-2">
          <p><strong>{t('username')}:</strong> {user.username}</p>
          <p><strong>{t('played')}:</strong> 0</p>
          <p><strong>{t('wins')}:</strong> 0</p>
          <p><strong>{t('joined')}:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        {id && user.id !== parseInt(id) && (
          <div className="mt-6 text-center space-x-2">
            <button
              onClick={handleAddFriend}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md"
            >
              {t('add_friend')}
            </button>
            <button
              onClick={handleBlockUser}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md"
            >
              {t('block_user')}
            </button>
            {status && <p className="mt-2 text-green-600 font-medium">{status}</p>}
          </div>
        )}

        <div className="mt-4 text-center">
          <button onClick={openAI} className="bg-blue-500 text-white p-2 rounded mr-2">{t('play_ai')}</button>
          <button onClick={openPVP} className="bg-blue-500 text-white p-2 rounded">{t('play_user')}</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
