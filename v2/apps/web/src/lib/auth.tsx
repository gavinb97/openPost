// ============================================================
// Auth Context — JWT auth state management
// ============================================================

'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authApi, ApiError } from './api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  tier: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const setAuth = useCallback((token: string, user: User) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const stored = localStorage.getItem('token');
      if (!stored) {
        setLoading(false);
        return;
      }
      setToken(stored);
      const user = await authApi.me();
      setUser(user);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAuth(res.token, res.user);
    router.push('/dashboard');
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await authApi.register({ email, username, password });
    setAuth(res.token, res.user);
    router.push('/dashboard');
  };

  const logout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
