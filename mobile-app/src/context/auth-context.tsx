import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { authApi } from '../api/endpoints';
import {
  getToken,
  getUser,
  removeToken,
  removeUser,
  saveToken,
  saveUser,
} from '../storage/auth';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([
        getToken(),
        getUser(),
      ]);

      if (token && storedUser) {
        setUser(storedUser);
      }

      setLoading(false);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authApi.login(username, password);

    await Promise.all([
      saveToken(result.accessToken),
      saveUser(result.user),
    ]);

    setUser(result.user);

    return result.user;
  };

  const logout = async () => {
    await Promise.all([removeToken(), removeUser()]);
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
