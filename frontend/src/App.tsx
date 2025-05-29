import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastContainerWrapper from './components/ToastContainerWrapper';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Chat from './components/Chat';
import AI from './pages/AI';
import PVP from './pages/PVP';
import TwoFactorAuth from './pages/TwoFactorAuth';
import GoogleLogin from './pages/GoogleLogin';
import GoogleCallback from './pages/GoogleCallback';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/pvp" element={<PVP />} />
        <Route path="/2fa" element={<TwoFactorAuth />} />
        <Route path="/google-login" element={<GoogleLogin />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
      </Routes>
      <ToastContainerWrapper />
    </BrowserRouter>
  );
};

export default App;