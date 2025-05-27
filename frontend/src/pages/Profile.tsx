import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUser, getUserByUsername, addFriend, blockUser } from '../services/api';
import { UserResponse } from '../types/auth';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<string>('');
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');

  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !id) {
        toast.error('Please log in to view your profile');
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
        toast.error(error.response?.data?.error || 'Failed to fetch user data');
        navigate('/Profile');
      }
    };

    fetchUser();
  }, [navigate]);


  const openAI = async () => {
    navigate('/ai');
  };

  const handleAddFriend = async () => {
    if (id && token && user && user.id !== parseInt(id)) {
      const result = await addFriend(id, user.id, token);
      setStatus(result.success ? 'Friend added!' : `Error: ${result.error}`);
    }
  };

  const handleBlockUser = async () => {
    if (id && token && user && user.id !== parseInt(id)) {
      const result = await blockUser(id, user.id, token);
      setStatus(result.success ? 'User blocked!' : `Error: ${result.error}`);
    }
  };
  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center animate-fade-in">
        Profile
      </h2>

      {user ? (
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto animate-fade-in">
          <img
            src={user.profilePhoto || 'https://via.placeholder.com/150'}
            alt={`${user.username}'s profile`}
            className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-blue-300 shadow-md"
          />
          <div className="text-center text-gray-800 space-y-2">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Played:</strong> 0</p>
            <p><strong>Wins:</strong> 0</p>
            <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

          {id && user.id !== parseInt(id) && (
            <div className="mt-6 text-center space-x-2">
              <button
                onClick={handleAddFriend}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md"
              >
                Add Friend
              </button>
              <button
                onClick={handleBlockUser}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md"
              >
                Block User
              </button>
              {status && <p className="mt-2 text-green-600 font-medium">{status}</p>}
            </div>
          )}

          <div className="mt-6 text-center space-x-2">
            <button 
            onClick={openAI}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md">
              Play with AI
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md">
              Play with User
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-700">Loading...</p>
      )}
    </div>
  );
};

export default Profile;