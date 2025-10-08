import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "next-auth";

interface UserState {
  user: Session["user"] | null;
  loading: boolean;
  setUser: (user: Session["user"] | null) => void;
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
