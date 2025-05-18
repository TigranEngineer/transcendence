import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">ft_transcendence</h1>
        <p className="text-lg text-gray-700 mb-4">Welcome to the Pong contest!</p>
        <Link to="/profile">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Start Game
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;