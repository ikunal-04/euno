"use client";

import { ReactNode, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUser";

function SyncUserWithStore() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setLoading = useUserStore((state) => state.setLoading);

  useEffect(() => {
    // While NextAuth is still loading → stay in loading state
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      setUser(session.user);
    } else {
      clearUser();
    }

    setLoading(false);
  }, [session, status, setUser, clearUser, setLoading]);

  return null;
}

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <SyncUserWithStore />
      {children}
    </SessionProvider>
  );
};
