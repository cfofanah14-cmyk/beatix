'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

interface OrganizerProfile {
  id: string;
  user_id: string;
  org_name: string | null;
  status: 'pending' | 'approved' | 'suspended';
  logo_url: string | null;
}

type ActiveView = 'buyer' | 'organizer';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  saveSession: (token: string, user: User) => void;
  logout: () => void;
  getToken: () => string | null;

  // ─── Organizer support ────────────────────────────────────────────────
  organizer: OrganizerProfile | null;
  isApprovedOrganizer: boolean;
  organizerLoading: boolean;
  activeView: ActiveView;
  switchToOrganizer: () => void;
  switchToBuyer: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VIEW_STORAGE_KEY = 'beatix_active_view';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null);
  const [organizerLoading, setOrganizerLoading] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('buyer');

  useEffect(() => {
    const token = localStorage.getItem('beatix_token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
    // Restore whichever view the person was last on, so a refresh doesn't
    // silently bounce an organizer back to the buyer view mid-task.
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (savedView === 'organizer' || savedView === 'buyer') {
      setActiveView(savedView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchOrganizerStatus(token);
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

  // Checks whether the current user has an approved organizers row.
  // A 404 here just means "not an organizer" — not an error state.
  const fetchOrganizerStatus = async (token: string) => {
    setOrganizerLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizer(data.organizer);
      } else {
        setOrganizer(null);
      }
    } catch (err) {
      console.error('Fetch organizer status error:', err);
      setOrganizer(null);
    } finally {
      setOrganizerLoading(false);
    }
  };

  const isApprovedOrganizer = organizer?.status === 'approved';

  const switchToOrganizer = useCallback(() => {
    if (!isApprovedOrganizer) return; // silently refuses — callers should check isApprovedOrganizer before showing the option at all
    setActiveView('organizer');
    localStorage.setItem(VIEW_STORAGE_KEY, 'organizer');
  }, [isApprovedOrganizer]);

  const switchToBuyer = useCallback(() => {
    setActiveView('buyer');
    localStorage.setItem(VIEW_STORAGE_KEY, 'buyer');
  }, []);

  const saveSession = (token: string, userData: User) => {
    localStorage.setItem('beatix_token', token);
    setUser(userData);
    fetchOrganizerStatus(token);
  };

  const logout = () => {
    localStorage.removeItem('beatix_token');
    localStorage.removeItem(VIEW_STORAGE_KEY);
    setUser(null);
    setOrganizer(null);
    setActiveView('buyer');
    window.location.href = '/onboarding';
  };

  const getToken = (): string | null => localStorage.getItem('beatix_token');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      saveSession,
      logout,
      getToken,
      organizer,
      isApprovedOrganizer,
      organizerLoading,
      activeView,
      switchToOrganizer,
      switchToBuyer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
