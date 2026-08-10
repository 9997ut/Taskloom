import { create } from 'zustand';
import { api, setAccessToken } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const data = await api<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (name, email, password) => {
    const data = await api<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });

    setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // still clear local state even if the server call fails
    }
    setAccessToken(null);
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      // try to refresh first to get a valid access token
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (!refreshRes.ok) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const refreshData = await refreshRes.json();
      setAccessToken(refreshData.accessToken);

      const data = await api<{ user: User }>('/auth/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
}));
