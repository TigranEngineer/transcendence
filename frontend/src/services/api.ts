import axios from 'axios';
import { RegisterRequest, LoginRequest, AuthResponse, UserResponse } from '../types/auth';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  console.log('Sending registration request:', data); // Debug log
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    console.log('Registration response:', response.data); // Debug log
    return response.data;
  } catch (error: any) {
    console.error('Registration error:', error.response?.data || error.message); // Debug log
    throw error;
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  console.log('Sending login request:', data); // Debug log
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    console.log('Login response:', response.data); // Debug log
    return response.data;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message); // Debug log
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  console.log('Sending logout request'); // Debug log
  try {
    await api.post('/auth/logout');
    console.log('Logout successful'); // Debug log
  } catch (error: any) {
    console.error('Logout error:', error.response?.data || error.message); // Debug log
    throw error;
  }
};

export const getUser = async (token: string): Promise<UserResponse> => {
  console.log('Sending getUser request with token:', token); // Debug log
  try {
    const response = await api.get<UserResponse>('/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('getUser response:', response.data); // Debug log
    return response.data;
  } catch (error: any) {
    console.error('getUser error:', error.response?.data || error.message); // Debug log
    throw error;
  }
};

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});