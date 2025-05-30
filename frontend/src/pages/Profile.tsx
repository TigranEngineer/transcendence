import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  getUser,
  getUserByUsername,
  getStats,
  addFriend,
  blockUser,
  getFriends,
  updatePassword,
  updateUsername,
  updateUserImage,
} from '../services/api';
import { Friend, ExtendedUserResponse, WinsAndGames } from '../types/auth';

const defaultAvatar =
  'https://st3.depositphotos.com/19428878/37434/v/450/depositphotos_374342112-stock-illustration-default-avatar-profile-icon-vector.jpg';


const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();

  const [user, setUser] = useState<ExtendedUserResponse | null>(null);
  const [stats, setStats] = useState<WinsAndGames | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);

  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) {
        toast.error(t('login_error'));
        return navigate('/login'); // Перенаправляем на страницу логина
      }

      try {
        const fetchedUser = username
          ? await getUserByUsername(token, username)
          : await getUser(token, id);

        if (fetchedUser) {
          setUser(fetchedUser);
          setNewNickname(fetchedUser.username);

          const fetchedStats = await getStats(token, fetchedUser.id.toString());
          setStats(fetchedStats);

          try {
            const fetchedFriends = await getFriends(token, fetchedUser.id.toString());
            setFriends(fetchedFriends);
          } catch (friendError) {
            toast.error(t('failed_fetch_friends'));
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || t('fetch_error'));
        navigate('/login'); // Перенаправляем на страницу логина
      }
    };

    fetchData();
  }, [username, token, id, navigate, t]);

  const isCurrentUser = user && id && user.id === Number(id); // Более строгая проверка

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('image_size_error'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalid_image_error'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        setIsSaving(true);
        const response = await updateUserImage(base64, token!);
        setUser((prev) => (prev ? { ...prev, profilePhoto: response.profilePhoto } : prev));
        toast.success(t('profile_picture_updated'));
      } catch (err: any) {
        toast.error(err.response?.data?.error || t('failed_update_picture'));
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNicknameChange = async () => {
    if (!newNickname.trim()) {
      toast.error(t('empty_nickname_error'));
      return;
    }
    if (!token || !id || newNickname === user?.username) return;

    try {
      setIsSaving(true);
      const res = await updateUsername(newNickname, token);
      setUser((prev) => (prev ? { ...prev, username: res.username } : prev));
      toast.success(t('nickname_updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('failed_update_nickname'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      toast.error(t('empty_password_error'));
      return;
    }
    if (!token || !id) return;

    try {
      setIsSaving(true);
      await updatePassword(newPassword, token);
      toast.success(t('password_updated'));
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('failed_update_password'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFriend = async () => {
    if (!token || !id || !user || isCurrentUser) return;
    try {
      const result = await addFriend(id, user.id, token);
      setStatusMessage(result.success ? t('friend_added') : `${t('error')}: ${result.error}`);
    } catch (err: any) {
      setStatusMessage(`${t('error')}: ${err.response?.data?.error || t('failed_add_friend')}`);
    }
  };

  const handleBlockUser = async () => {
    if (!token || !id || !user || isCurrentUser) return;
    try {
      const result = await blockUser(id, user.id, token);
      setStatusMessage(result.success ? t('user_blocked') : `${t('error')}: ${result.error}`);
    } catch (err: any) {
      setStatusMessage(`${t('error')}: ${err.response?.data?.error || t('failed_block_user')}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-pink-100 p-6">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">{t('profile')}</h2>

      <div className="relative max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg">
        {isCurrentUser && (
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <img
              src="https://static-00.iconduck.com/assets.00/settings-icon-2048x2046-cw28eevx.png"
              alt={t('settings')}
              className="h-5 w-5"
            />
          </button>
        )}

        <img
          src={user.profilePhoto || defaultAvatar}
          alt="avatar"
          className="w-32 h-32 mx-auto rounded-full border-4 border-blue-300 object-cover"
        />

        <div className="mt-4 text-center space-y-2">
          <p>
            <strong>{t('username')}:</strong> {user.username}
          </p>
          <p>
            <strong>{t('played')}:</strong> {stats?.games ?? 0}
          </p>
          <p>
            <strong>{t('wins')}:</strong> {stats?.wins ?? 0}
          </p>
          <p>
            <strong>{t('joined')}:</strong> {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {!isCurrentUser && (
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleAddFriend}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {t('add_friend')}
            </button>
            <button
              onClick={handleBlockUser}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              {t('block_user')}
            </button>
          </div>
        )}
        {statusMessage && <p className="mt-4 text-center text-green-600">{statusMessage}</p>}

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => navigate('/ai')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('play_ai')}
          </button>
          <button
            onClick={() => navigate('/pvp')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('play_user')}
          </button>
          <button
            onClick={() => setShowFriendsList(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            {t('friends_list')}
          </button>
        </div>
      </div>

      {/* Friends List Modal */}
      {showFriendsList && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowFriendsList(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-center mb-4">{t('your_friends')}</h3>
            <div className="max-h-64 overflow-y-auto border rounded p-4 bg-gray-50 mb-4">
              {friends.length ? (
                <ul className="space-y-2">
                  {friends.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <img
                        src={f.profilePhoto || defaultAvatar}
                        alt={f.username}
                        className="w-8 h-8 rounded-full border object-cover"
                      />
                      <span className="text-sm">{f.username}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-500">{t('no_friends')}</p>
              )}
            </div>
            <button
              onClick={() => setShowFriendsList(false)}
              className="w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && isCurrentUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-center mb-4">{t('account_settings')}</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('profile_picture')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full border rounded p-2"
                disabled={isSaving}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('change_nickname')}</label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="w-full border rounded p-2"
                disabled={isSaving}
              />
              <button
                onClick={handleNicknameChange}
                className="w-full mt-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                disabled={isSaving}
              >
                {isSaving ? t('saving') : t('save_nickname')}
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('change_password')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded p-2"
                disabled={isSaving}
              />
              <button
                onClick={handlePasswordChange}
                className="w-full mt-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                disabled={isSaving}
              >
                {isSaving ? t('saving') : t('save_password')}
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;