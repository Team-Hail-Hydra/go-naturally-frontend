import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";

export type UserRole = "STUDENT" | "TEACHER" | "NGO";

export interface UserData {
  id: string;
  fullName: string;
  email: string;
  profilePic?: string;
  role: UserRole;
  schoolId?: string;
  ngoId?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStore {
  // Supabase user data
  user: User | null;
  accessToken: string;

  // Backend user data
  userData: UserData | null;

  // Loading states
  loading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string) => void;
  setUserData: (userData: UserData | null) => void;
  setLoading: (loading: boolean) => void;

  // Clear all data (for logout)
  clearStore: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: "",
      userData: null,
      loading: false,

      // Actions
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUserData: (userData) => set({ userData }),
      setLoading: (loading) => set({ loading }),

      // Clear all data
      clearStore: () =>
        set({
          user: null,
          accessToken: "",
          userData: null,
          loading: false,
        }),
    }),
    {
      name: "user-store", // name of the item in localStorage
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        accessToken: state.accessToken,
        userData: state.userData,
      }),
    }
  )
);
