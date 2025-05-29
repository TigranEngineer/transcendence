import axios from 'axios';
import { RegisterRequest, LoginRequest, AuthResponse, UserResponse } from '../types/auth';

const USER_SERVICE_URL = 'http://localhost:3000';
const AUTH_SERVICE_URL = 'http://localhost:3001';
const CHAT_SERVICE_URL = 'http://localhost:4000';

const userApi = axios.create({
  baseURL: USER_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const authApi = axios.create({
  baseURL: AUTH_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const chatApi = axios.create({
  baseURL: CHAT_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  console.log('Sending registration request:', data);
  try {
    const response = await authApi.post<AuthResponse>('/api/auth/register', data);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  console.log('Sending login request:', data);
  try {
    const response = await authApi.post<AuthResponse>('/api/auth/login', data);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const enable2FA = async (token: string): Promise<{ qrCodeUrl: string; secret: string }> => {
  console.log('Sending 2FA enable request with token:', token);
  try {
    const response = await authApi.post<{ qrCodeUrl: string; secret: string }>('/api/auth/2fa/enable', null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('2FA enable response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('2FA enable error:', error.response?.data || error.message);
    throw error;
  }
};

export const verify2FA = async (code: string, token: string): Promise<{ verified: boolean }> => {
  console.log('Sending 2FA verify request with code:', code);
  try {
    const response = await authApi.post<{ verified: boolean }>('/api/auth/2fa/verify', { code }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('2FA verify response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('2FA verify error:', error.response?.data || error.message);
    throw error;
  }
};

export const disable2FA = async (token: string): Promise<{ message: string }> => {
  console.log('Sending 2FA disable request with token:', token);
  try {
    const response = await authApi.post<{ message: string }>('/api/auth/2fa/disable', null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('2FA disable response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('2FA disable error:', error.response?.data || error.message);
    throw error;
  }
};

export const googleLogin = async (): Promise<void> => {
  console.log('Initiating Google login redirect');
  window.location.href = `${AUTH_SERVICE_URL}/api/auth/google`;
};

export const updateUsername = async (username: string, token: string): Promise<UserResponse> => {
  console.log('Sending username update request:', { username, token });
  try {
    const response = await userApi.patch<UserResponse>('/api/users/change/username', { username }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Username update response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Username update error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateUserImage = async (base64Image: string, token: string): Promise<UserResponse> => {
  try {
    const response = await userApi.patch<UserResponse>('/api/users/change/image', { image: base64Image }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Image update response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Image update error:', error.response?.data || error.message);
    throw error;
  }
};

export const updatePassword = async (password: string, token: string): Promise<AuthResponse> => {
  console.log('Sending password update request:', { password, token });
  try {
    const response = await authApi.patch<AuthResponse>('/api/auth/change/password', { password }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Password update response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Password update error:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  console.log('Sending logout request');
  try {
    await authApi.post('/api/auth/logout');
    console.log('Logout successful');
    localStorage.removeItem('token');
    localStorage.removeItem('id');
  } catch (error: any) {
    console.error('Logout error:', error.response?.data || error.message);
    throw error;
  }
};

export const getUser = async (token: string, id: string): Promise<UserResponse> => {
  console.log('Sending getUser request with token:', token);
  try {
    const response = await userApi.get<UserResponse>(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('getUser response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getUser error:', error.response?.data || error.message);
    throw error;
  }
};

export const getUserByUsername = async (token: string, username: string): Promise<UserResponse> => {
  try {
    const response = await userApi.get<UserResponse>(`/api/users/username/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('getUserByUsername error:', error.response?.data || error.message);
    throw error;
  }
};

export const addFriend = async (id: string, friendId: number, token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await userApi.post(`/api/users/friends`, { id, friendId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Unknown error' };
  }
};

export const blockUser = async (id: string, blockedId: number, token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await userApi.post(`/api/users/block`, { id, blockedId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Unknown error' };
  }
};

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

chatApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});