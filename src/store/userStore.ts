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

  // Avatar URL for 3D model
  avatarUrl: string | null;

  // Eco points (dummy for now)
  ecoPoints: number;

  // Loading states
  loading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string) => void;
  setUserData: (userData: UserData | null) => void;
  setAvatarUrl: (avatarUrl: string | null) => void;
  setEcoPoints: (points: number) => void;
  addEcoPoints: (points: number) => void;
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
      avatarUrl: null,
      ecoPoints: 200, // Dummy starting points
      loading: false,

      // Actions
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUserData: (userData) => set({ userData }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      setEcoPoints: (points) => set({ ecoPoints: points }),
      addEcoPoints: (points) =>
        set((state) => ({ ecoPoints: state.ecoPoints + points })),
      setLoading: (loading) => set({ loading }),

      // Clear all data
      clearStore: () =>
        set({
          user: null,
          accessToken: "",
          userData: null,
          avatarUrl: null,
          ecoPoints: 200, // Reset to dummy starting points
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
        avatarUrl: state.avatarUrl,
        ecoPoints: state.ecoPoints,
      }),
    }
  )
);
