import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "next-auth";

type ExtendedUser = Session["user"] & {
  id?: number;
  userId?: string;
  imageUrl?: string;
  plans?: string | null;
};

interface UserState {
  user: ExtendedUser | null;
  loading: boolean;
  setUser: (user: ExtendedUser | null) => void;
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
