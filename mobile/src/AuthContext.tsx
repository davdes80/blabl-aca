import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, User } from './api';

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fields: { name: string; email: string; password: string; phone?: string; carModel?: string }) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: User }>('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const d = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(d.token);
    setUser(d.user);
  };

  const signUp = async (fields: { name: string; email: string; password: string; phone?: string; carModel?: string }) => {
    const d = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: fields,
    });
    setToken(d.token);
    setUser(d.user);
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const d = await api<{ user: User }>('/auth/me');
    setUser(d.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
