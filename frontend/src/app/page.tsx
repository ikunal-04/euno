"use client"

import React from 'react';
import { useSession } from 'next-auth/react';
import { VoiceChat } from "@/components/therapy/voice-chat"
import MindSpaceLanding from "@/components/landing"
import NavBarMain from "@/components/navbar-main"

// Main App Component
export default function Page() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <NavBarMain />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <VoiceChat />
        </div>
      </div>

    );
  }

  return <MindSpaceLanding />;
}