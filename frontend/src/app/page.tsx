"use client"

import React from 'react';
import { useSession } from 'next-auth/react';
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { VoiceChat } from "@/components/therapy/voice-chat"
import MindSpaceLanding from "@/components/landing"

// Main App Component
export default function Page() {
  const { data: session } = useSession();


  // If user is signed in, show the app
  if (session) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <VoiceChat />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // If user is not signed in, show landing page
  return <MindSpaceLanding />;
}