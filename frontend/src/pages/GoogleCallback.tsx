import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const GoogleCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const token = query.get('token');
        const userId = query.get('userId');
        const error = query.get('error');

        if (error) {
            toast.error(error);
            navigate('/login');
            return;
        }

        if (token && userId) {
            localStorage.setItem('token', token);
            localStorage.setItem('id', userId);
            toast.success('Google Sign-In successful');
            navigate(`/profile/${userId}`);
        } else {
            toast.error('Invalid Google Sign-In response');
            navigate('/login');
        }
    }, [navigate, location]);

    return <div className="text-center text-gray-500">{t('Processing_Google_Sign_In')}</div>;
};

export default GoogleCallback;