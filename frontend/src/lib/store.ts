import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'interviewer' | 'candidate') => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  signIn: async (email: string, _password: string) => {
    set({ loading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    set({
      user: {
        id: '1',
        email,
        role: 'interviewer',
        fullName: 'Demo User',
      },
      loading: false,
    });
  },
  signUp: async (email: string, _password: string, role: 'interviewer' | 'candidate') => {
    set({ loading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    set({
      user: {
        id: '1',
        email,
        role,
        fullName: 'Demo User',
      },
      loading: false,
    });
  },
  signOut: () => {
    set({ user: null });
  },
}));