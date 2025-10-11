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
      <div className="min-h-screen flex flex-col">
   
        <NavBarMain />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <VoiceChat />
        </div>
      </div>
    );
  }

  return <MindSpaceLanding />;
}
