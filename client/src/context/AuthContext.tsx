/* eslint-disable react-refresh/only-export-components */
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient, { setAuthToken } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem('ankicode_token');
      if (!storedToken) {
        setInitializing(false);
        return;
      }

      setAuthToken(storedToken);
      setLoading(true);
      try {
        const response = await apiClient.get<{ user: User }>('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.error('Failed to restore session', err);
        localStorage.removeItem('ankicode_token');
        setAuthToken(null);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    void bootstrap();
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<{ user: User; token: string }>(`/auth/login`, {
        email,
        password,
      });
      const { user: authenticatedUser, token } = response.data;
      setUser(authenticatedUser);
      localStorage.setItem('ankicode_token', token);
      setAuthToken(token);
    } catch (err) {
      console.error('Login failed', err);
      setError('Invalid email or password. Try the demo credentials from the README.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ankicode_token');
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      error,
      initializing,
    }),
    [user, loading, error, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

