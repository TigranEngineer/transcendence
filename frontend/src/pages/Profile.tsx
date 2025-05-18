import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUser } from '../services/api';
import { UserResponse } from '../types/auth';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view your profile');
        navigate('/login');
        return;
      }

      try {
        const userData = await getUser(token);
        setUser(userData);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to fetch user data');
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Profile</h2>
        <div className="mb-4">
          <p className="text-gray-700"><strong>Username:</strong> {user.username}</p>
        </div>
        <div className="mb-4">
          <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
        </div>
        <div className="mb-4">
          <p className="text-gray-700"><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;