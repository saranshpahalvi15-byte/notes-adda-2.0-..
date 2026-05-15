import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  classLevel?: string;
  referralCode: string;
  referralsCount?: number;
  referredBy?: string;
  wishlist?: string[];
  streakCount?: number;
  lastActivityDate?: string;
  timeSpentToday?: number;
  streakIncrementedToday?: boolean;
  createdAt: string;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setNotification: (notif: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true,
      notification: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setNotification: (notification) => {
        set({ notification });
        if (notification) {
          setTimeout(() => set({ notification: null }), 3000);
        }
      },
      logout: () => set({ user: null, profile: null, notification: null }),
    }),
    {
      name: 'auth-storage',
      // ONLY persist profile. Never persist raw Firebase User object as it loses its internal API methods.
      partialize: (state) => ({ profile: state.profile } as any),
    }
  )
);
