import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuthState } from '@/firebase/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { UserProfile } from '@/types/models';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
  profileLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuthState((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const { profile, loading: profileLoading } = useUserProfile(user?.uid);

  return (
    <AuthContext.Provider value={{ user, profile, authLoading, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
