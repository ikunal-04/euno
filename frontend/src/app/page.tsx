"use client";

import React from "react";
import { VoiceChat } from "@/components/therapy/voice-chat";
import MindSpaceLanding from "@/components/landing";
import NavBarMain from "@/components/navbar-main";
import { useUserStore } from "@/store/useUser";
import LoadingScreen from "@/components/loader";  


export default function Page() {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);

  if (loading) {
    return (
      <LoadingScreen />
    )
  }

  if (user) {
    return (
      <div className="relative h-[100dvh] overflow-hidden">
        <NavBarMain />
        <VoiceChat />
      </div>
    );
  }

  return <MindSpaceLanding />;
}
