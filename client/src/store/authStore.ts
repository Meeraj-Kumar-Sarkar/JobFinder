import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUser: null,
      loading: true,
      setUser: (user) => set({ user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, firebaseUser: null, loading: false }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
