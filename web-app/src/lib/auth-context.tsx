'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { authApi, clearAuth, getToken, saveToken } from './api';
import type { AuthUser } from '@/types';

const USER_KEY = 'authUser';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (token && storedUser) {
      setUser(JSON.parse(storedUser) as AuthUser);
    }

    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authApi.login(username, password);

    saveToken(result.accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);

    return result.user;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth ต้องถูกใช้งานภายใน AuthProvider');
  }

  return context;
}
