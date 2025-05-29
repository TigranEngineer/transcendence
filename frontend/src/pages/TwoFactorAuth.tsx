import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { enable2FA, verify2FA, disable2FA } from '../services/api';
import { Enable2FAResponse, Verify2FAResponse, Disable2FAResponse } from '../types/auth';
import { useTranslation } from 'react-i18next';

const TwoFactorAuth: React.FC = () => {
    const navigate = useNavigate();
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const storedEnabled = localStorage.getItem('twoFactorEnabled');
        setIsEnabled(storedEnabled === 'true');
    }, []);

    const handleEnable2FA = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await enable2FA(token);
                setQrCodeUrl(response.qrCodeUrl);
                setSecret(response.secret);
                setIsEnabled(true);
                localStorage.setItem('twoFactorEnabled', 'true'); // Update localStorage
                toast.success('Scan the QR code with your authenticator app');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to enable 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await verify2FA(code, token);
                if (response.verified) {
                    toast.success('2FA verified successfully');
                    setQrCodeUrl(null);
                    setSecret(null);
                    setCode('');
                } else {
                    toast.error('Invalid 2FA code');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await disable2FA(token);
                setIsEnabled(false);
                localStorage.removeItem('twoFactorEnabled'); // Update localStorage
                toast.success(response.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
                <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">{t('enable_2FA')}</h2>
                {isEnabled && !qrCodeUrl && (
                    <p className="text-center text-green-600 mb-4">{t('2FA_is_enabled_You_can_disable_it_below')}</p>
                )}
                {!isEnabled && !qrCodeUrl && (
                    <button
                        onClick={handleEnable2FA}
                        disabled={loading}
                        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-xl disabled:bg-gray-400"
                    >
                        {t('enable_2FA')}
                    </button>
                )}
                {qrCodeUrl && (
                    <div className="mb-4 text-center">
                        <p>{t('erkar')}:</p>
                        <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto my-4 w-48 h-48" />
                        <p>{t('secret')}: {secret}</p>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 mt-2"
                        />
                        <button
                            onClick={handleVerify2FA}
                            disabled={loading || code.length !== 6}
                            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-xl mt-2 disabled:bg-gray-400"
                        >
                            {t('verify')}
                        </button>
                    </div>
                )}
                {isEnabled && (
                    <button
                        onClick={handleDisable2FA}
                        disabled={loading}
                        className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-xl mt-4"
                    >
                        {t('Disable_2FA')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TwoFactorAuth;