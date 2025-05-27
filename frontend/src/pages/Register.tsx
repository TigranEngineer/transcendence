import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUser, getUserByUsername, setup2FA } from '../services/api';
import { UserResponse } from '../types/auth';
import QRCode from 'react-qr-code';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');
  const [user, setUser] = useState<UserResponse | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !id) {
        toast.error('Please log in to view your profile');
        navigate('/login');
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
        toast.error(error.response?.data?.error || 'Failed to fetch user data');
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate, token, id, username]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handlePlayAI = () => {
    navigate('/ai');
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Profile</h2>
        <div className="mb-4">
          <p className="text-gray-700"><strong>Username:</strong> {user.username}</p>
          <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
          {user.profilePhoto && (
            <img
              src={user.profilePhoto}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mt-4"
            />
          )}
          <div className="flex flex-col space-y-4 mt-4">
            <button
              onClick={handlePlayAI}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              Play with AI
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
            <div className="mt-4">
              <h3 className="text-lg font-bold mb-2">Two-Factor Authentication</h3>
              {!user.twoFASecret ? (
                <button
                  onClick={async () => {
                    try {
                      const response = await setup2FA(user.id);
                      setUser({ ...user, twoFASecret: response.secret });
                      setQrCodeUrl(response.otpauthUrl);
                    } catch (error: any) {
                      toast.error('Failed to setup 2FA');
                    }
                  }}
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  Enable 2FA
                </button>
              ) : (
                <p>2FA is enabled</p>
              )}
              {qrCodeUrl && (
                <div className="mt-4">
                  <p>Scan this QR code with an authenticator app:</p>
                  <QRCode value={qrCodeUrl} size={200} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
