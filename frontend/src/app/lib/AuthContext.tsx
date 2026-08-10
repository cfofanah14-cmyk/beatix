'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  saveSession: (token: string, user: User) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('beatix_token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('beatix_token');
      }
    } catch (err) {
      console.error('Fetch user error:', err);
      localStorage.removeItem('beatix_token');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (token: string, userData: User) => {
    localStorage.setItem('beatix_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('beatix_token');
    setUser(null);
    window.location.href = '/onboarding';
  };

  const getToken = (): string | null => localStorage.getItem('beatix_token');

  return (
    <AuthContext.Provider value={{ user, loading, saveSession, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
