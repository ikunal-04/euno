"use client";

import React from "react";
import { VoiceChat } from "@/components/therapy/voice-chat";
import MindSpaceLanding from "@/components/landing";
import NavBarMain from "@/components/navbar-main";
import { useUserStore } from "@/store/useUser";
import Loader from "@/components/loader";
import { motion } from "framer-motion";

export default function Page() {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);

  if (loading) {
    return (
      <motion.div
    key="loader"
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <Loader />
  </motion.div>
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
