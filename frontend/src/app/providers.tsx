"use client";

import { ReactNode, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUser";
import { Users } from "@/types/users";
import { Toaster } from "sonner";

function SyncUserWithStore() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setLoading = useUserStore((state) => state.setLoading);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        if (status === "loading") return;

        if (status === "authenticated" && session?.user) {
          const res = await fetch("/api/user");
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setUser(session.user as Users);
          }
        } else {
          clearUser();
        }
      } catch (err) {
        console.error("Failed to sync user:", err);
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [ status, setUser, clearUser, setLoading]);

  return null;
}

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <SyncUserWithStore />
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={true}
        duration={4000}
      />
    </SessionProvider>
  );
};
