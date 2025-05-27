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



    const RunAI = async () => {
      navigate('/ai');
      return ;
    };

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
    <div className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Profile</h2>
      {user ? (
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
          <img
            src={user.profilePhoto || 'https://via.placeholder.com/150'}
            alt={`${user.username}'s profile`}
            className="w-40 h-40 rounded-full mx-auto mb-4"
          />
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Played:</strong> 0</p>
          <p><strong>Wins:</strong> 0</p>
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          {id && user.id !== parseInt(id) && (
            <div className="mt-4">
              <button onClick={handleAddFriend} className="bg-green-500 text-white p-2 rounded mr-2">
                Add Friend
              </button>
              <button onClick={handleBlockUser} className="bg-red-500 text-white p-2 rounded">
                Block User
              </button>
              {status && <p className="mt-2 text-green-500">{status}</p>}
            </div>
          )}
          <div className="mt-4">
            <button onClick={openAI} className="bg-blue-500 text-white p-2 rounded mr-2">Play with AI</button>
            <button className="bg-blue-500 text-white p-2 rounded">Play with User</button>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Profile;