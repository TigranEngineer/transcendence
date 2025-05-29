import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const GoogleCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

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

    return <div className="text-center text-gray-500">Processing Google Sign-In...</div>;
};

export default GoogleCallback;