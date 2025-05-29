import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUser, getUserByUsername, getStats, addFriend, blockUser, updatePassword, updateUsername, updateUserImage } from '../services/api';
import { UserResponse, WinsAndGames } from '../types/auth';
import { useTranslation } from 'react-i18next';
// import { LanguageSwitcher } from '../components/Navbar';


const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [newNickname, setNewNickname] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [stats, setStats] = useState<WinsAndGames | null>(null);

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
        const userData = username
          ? await getUserByUsername(token, username)
          : await getUser(token, id);
        setUser(userData);
        if (userData) {
          const statsData = await getStats(token, userData.id.toString());
          setStats(statsData);
        }
        setNewNickname(userData.username);
      } catch (error: any) {
        toast.error(error.response?.data?.error || t('fetch_error'));
        navigate('/Profile');
      }
    };

    fetchUser();
  }, [navigate, token, id, username, t]);

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

  const handleSaveImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error(t('image_size_error'));
    }

    if (!file.type.startsWith('image/')) {
      return toast.error(t('invalid_image_error'));
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const base64Image = reader.result as string;

      if (!token) {
        return toast.error(t('unauthorized_error'));
      }

      try {
        setIsSaving(true);
        const response = await updateUserImage(base64Image, token);
        setUser(prev => (prev ? { ...prev, profilePhoto: response.profilePhoto } : null));
        toast.success(t('profile_picture_updated'));
      } catch (error: any) {
        toast.error(error.response?.data?.error || t('failed_update_picture'));
      } finally {
        setIsSaving(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSavePassword = async () => {
    if (!newPassword) return toast.error(t('empty_password_error'));
    if (!token || !id) return toast.error(t('unauthorized_error'));

    try {
      setIsSaving(true);
      const response = await updatePassword(newPassword, token);
      localStorage.setItem('id', response.user.id.toString());
      toast.success(t('password_updated'));
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('failed_update_password'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!newNickname) return toast.error(t('empty_nickname_error'));
    if (!token || !id) return toast.error(t('unauthorized_error'));
    if (newNickname === user?.username) return toast.info(t('nickname_unchanged'));

    try {
      setIsSaving(true);
      const response = await updateUsername(newNickname, token);
      setUser(prev => (prev ? { ...prev, username: response.username } : null));
      toast.success(t('nickname_updated'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('failed_update_nickname'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      {/* <LanguageSwitcher /> */}
      <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">{t('profile')}</h2>

      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto relative">
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200"
          aria-label={t('settings')}
        >
          <img
            src="https://static-00.iconduck.com/assets.00/settings-icon-2048x2046-cw28eevx.png"
            alt={t('settings')}
            className="h-6 w-6"
          />
        </button>

        <img
          src={user.profilePhoto || 'https://st3.depositphotos.com/19428878/37434/v/450/depositphotos_374342112-stock-illustration-default-avatar-profile-icon-vector.jpg'}
          alt={`${user.username}'s profile`}
          className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-blue-300 shadow-md"
        />

        <div className="text-center text-gray-800 space-y-2">
          <p>
            <strong>{t('username')}:</strong> {user.username}
          </p>
          <p>
            <strong>{t('played')}:</strong> {stats?.games}
          </p>
          <p>
            <strong>{t('wins')}:</strong> {stats?.wins}
          </p>
          <p>
            <strong>{t('joined')}:</strong>{' '}
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>

        {id && user.id !== parseInt(id) && (
          <div className="mt-6 text-center space-x-2">
            <button
              onClick={handleAddFriend}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {t('add_friend')}
            </button>
            <button
              onClick={handleBlockUser}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              {t('block_user')}
            </button>
            {status && <p className="mt-2 text-green-600 font-medium">{status}</p>}
          </div>
        )}

        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => navigate('/ai')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t('play_ai')}
          </button>
          <button
            onClick={() => navigate('/pvp')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t('play_user')}
          </button>
        </div>
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">{t('account_settings')}</h2>

            <label className="block mb-2 font-medium">{t('profile_picture')}:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSaveImage}
              className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-300"
            />

            <label className="block mb-2 font-medium">{t('change_nickname')}:</label>
            <input
              type="text"
              value={newNickname}
              onChange={e => setNewNickname(e.target.value)}
              placeholder={t('enter_new_nickname')}
              className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-300 Copa City"
            />
            <button
              onClick={handleSaveNickname}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
              disabled={isSaving}
            >
              {isSaving ? t('saving') : t('save_nickname')}
            </button>

            <label className="block mb-2 font-medium">{t('change_password')}:</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t('enter_new_password')}
              className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-300"
            />
            <button
              onClick={handleSavePassword}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
              disabled={isSaving}
            >
              {isSaving ? t('saving') : t('save_password')}
            </button>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;






















