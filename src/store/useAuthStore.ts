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
  downloadCredits?: number;
  creditsResetDate?: string;
  downloadedNotes?: string[];
  createdAt: string;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, profile: null }),
    }),
    {
      name: 'auth-storage',
      // ONLY persist profile. Never persist raw Firebase User object as it loses its internal API methods.
      partialize: (state) => ({ profile: state.profile } as any),
    }
  )
);
