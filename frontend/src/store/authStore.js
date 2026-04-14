import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      driverProfile: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token, refreshToken) => set({ token, refreshToken }),
      setDriverProfile: (driverProfile) => set({ driverProfile }),

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', credentials);
          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true, user: data.user };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', userData);
          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true, user: data.user };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
      },

      googleAuth: async (accessToken, role = 'user') => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/google', { accessToken, role });
          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true, user: data.user };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || 'Google Auth failed' };
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch (_) {}
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, refreshToken: null, driverProfile: null, isAuthenticated: false });
      },

      refreshMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, driverProfile: data.driverProfile });
          return data.user;
        } catch (error) {
          get().logout();
          return null;
        }
      },

      updateProfile: async (updates) => {
        try {
          const { data } = await api.put('/auth/profile', updates);
          set({ user: data.user });
          return { success: true };
        } catch (error) {
          return { success: false, message: error.response?.data?.message };
        }
      }
    }),
    {
      name: 'shareway-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
