import axios from 'axios';
import { RegisterRequest, LoginRequest, AuthResponse, UserResponse, TwoFASetupResponse, TwoFAVerifyRequest, LoginResponse } from '../types/auth';

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

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  console.log('Sending login request:', data);
  try {
    const response = await authApi.post<LoginResponse>('/api/auth/login', data);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  console.log('Sending logout request');
  try {
    await authApi.post('/api/auth/logout');
    console.log('Logout successful');
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
  return await userApi.get<UserResponse>(`/api/users/username/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data);
};

export const addFriend = async (id: string, friendId: number, token: string): Promise<{ success: boolean; error?: string }> => {
  return await userApi.post(`/api/users/friends`, { id, friendId }, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data).catch(err => ({ success: false, error: err.response?.data?.error || 'Unknown error' }));
};

export const blockUser = async (id: string, blockedId: number, token: string): Promise<{ success: boolean; error?: string }> => {
  return await userApi.post(`/api/users/block`, { id, blockedId }, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data).catch(err => ({ success: false, error: err.response?.data?.error || 'Unknown error' }));
};

export const setup2FA = async (userId: number): Promise<TwoFASetupResponse> => {
  console.log('Sending 2FA setup request for userId:', userId);
  try {
    const response = await authApi.post<TwoFASetupResponse>('/api/auth/setup-2fa', { userId });
    console.log('2FA setup response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('2FA setup error:', error.response?.data || error.message);
    throw error;
  }
};

export const verify2FA = async (data: TwoFAVerifyRequest): Promise<AuthResponse> => {
  console.log('Sending 2FA verification request:', data);
  try {
    const response = await authApi.post<AuthResponse>('/api/auth/verify-2fa', data);
    console.log('2FA verification response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('2FA verification error:', error.response?.data || error.message);
    throw error;
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
