import { create } from 'zustand';
import { api } from '../api/client';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
  },
  async logout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) await api.post('/auth/logout', { refreshToken });
    set({ user: null, accessToken: null, refreshToken: null });
  }
}));
