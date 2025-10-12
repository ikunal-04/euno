import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Users } from "@/types/users";

interface UserState {
  user: Users | null;
  loading: boolean;
  setUser: (user: Users | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: "user-store" }
  )
);
