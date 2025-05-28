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

  const openPVP = async () => {
    navigate('/pvp');
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
          <div className="mt-4">
            <button onClick={openAI} className="bg-blue-500 text-white p-2 rounded mr-2">Play with AI</button>
            <button onClick={openPVP} className="bg-blue-500 text-white p-2 rounded">Play with User</button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-700">Loading...</p>
      )}
    </div>
  );
};

export default Profile;

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';

// interface User {
//   id: string;
//   username: string;
// }

// const Profile: React.FC = () => {
//   const navigate = useNavigate();
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [users, setUsers] = useState<User[]>([]);
//   const [selectedOpponent, setSelectedOpponent] = useState<string>('');

//   // Fetch current user data
//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       try {
//         // Replace with your actual API endpoint
//         const response = await fetch('/api/users/me', {
//           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//         });
//         if (!response.ok) throw new Error('Failed to fetch user');
//         const data = await response.json();
//         setCurrentUser({ id: data.id, username: data.username });
//       } catch (error) {
//         toast.error('Error fetching user data');
//       }
//     };

//     const fetchUsers = async () => {
//       try {
//         // Replace with your actual API endpoint
//         const response = await fetch('/api/users');
//         if (!response.ok) throw new Error('Failed to fetch users');
//         const data = await response.json();
//         setUsers(data.users || []);
//       } catch (error) {
//         toast.error('Error fetching users');
//       }
//     };

//     fetchCurrentUser();
//     fetchUsers();
//   }, []);

//   const handlePlayWithAI = () => {
//     if (!currentUser) {
//       toast.error('Please log in to play');
//       return;
//     }
//     navigate('/pong', { state: { player1Name: currentUser.username, player2Name: 'AI' } });
//   };

//   const handlePlayWithUser = () => {
//     if (!currentUser) {
//       toast.error('Please log in to play');
//       return;
//     }
//     if (!selectedOpponent) {
//       toast.error('Please select an opponent');
//       return;
//     }
//     const opponent = users.find((user) => user.id === selectedOpponent);
//     if (opponent) {
//       navigate('/pong', { state: { player1Name: currentUser.username, player2Name: opponent.username } });
//     } else {
//       toast.error('Invalid opponent selected');
//     }
//   };

//   const styles: { [key: string]: React.CSSProperties } = {
//     container: {
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       justifyContent: 'center',
//       height: '100vh',
//       background: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)',
//       color: '#eee',
//       fontFamily: "'Segoe UI', Arial, sans-serif",
//     },
//     title: {
//       fontSize: '32px',
//       marginBottom: '20px',
//     },
//     button: {
//       background: '#4caf50',
//       border: 'none',
//       color: 'white',
//       padding: '10px 20px',
//       borderRadius: '8px',
//       cursor: 'pointer',
//       fontWeight: 600,
//       margin: '10px',
//       transition: 'background 0.3s ease',
//     },
//     select: {
//       padding: '8px',
//       borderRadius: '8px',
//       fontSize: '16px',
//       margin: '10px',
//       width: '200px',
//     },
//   };

//   return (
//     <div style={styles.container}>
//       <h1 style={styles.title}>Welcome, {currentUser ? currentUser.username : 'Loading...'}</h1>
//       <button
//         style={styles.button}
//         onClick={handlePlayWithAI}
//         onMouseEnter={(e) => (e.currentTarget.style.background = '#45a049')}
//         onMouseLeave={(e) => (e.currentTarget.style.background = '#4caf50')}
//         aria-label="Play with AI"
//       >
//         Play with AI
//       </button>
//       <div>
//         <select
//           style={styles.select}
//           value={selectedOpponent}
//           onChange={(e) => setSelectedOpponent(e.target.value)}
//           aria-label="Select opponent"
//         >
//           <option value="">Select an opponent</option>
//           {users
//             .filter((user) => user.id !== currentUser?.id)
//             .map((user) => (
//               <option key={user.id} value={user.id}>
//                 {user.username}
//               </option>
//             ))}
//         </select>
//         <button
//           style={styles.button}
//           onClick={handlePlayWithUser}
//           onMouseEnter={(e) => (e.currentTarget.style.background = '#45a049')}
//           onMouseLeave={(e) => (e.currentTarget.style.background = '#4caf50')}
//           aria-label="Play with user"
//         >
//           Play with User
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Profile;