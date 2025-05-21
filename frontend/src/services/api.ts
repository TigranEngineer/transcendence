import axios from 'axios';
import { RegisterRequest, LoginRequest, AuthResponse, UserResponse } from '../types/auth';

const USER_SERVICE_URL = 'http://localhost:3002';
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

export const getUser = async (token: string): Promise<UserResponse> => {
  console.log('Sending getUser request with token:', token);
  try {
    const response = await userApi.get<UserResponse>('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('getUser response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getUser error:', error.response?.data || error.message);
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