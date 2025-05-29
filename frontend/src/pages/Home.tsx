import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4 drop-shadow-lg">
          ft_transcendence
        </h1>
        <p className="text-xl text-gray-800 mb-6">{t('pong')}</p>
        <Link to="/profile">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl">
          {t('sg')}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;