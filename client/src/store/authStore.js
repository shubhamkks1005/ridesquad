import { create } from 'zustand';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,

  // REGISTER FUNCTION
  register: async (userData) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/api/auth/register', userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  },

  // LOGIN FUNCTION
  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/api/auth/login', credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      toast.success('Login successful!');
      return data;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  },

  // LOGOUT FUNCTION
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
    toast.success('Logged out!');
  },
}));