"use client";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/store/useUser";
import { motion } from "framer-motion";

export const UserSettings = () => {
  const { user } = useUserStore();

  return (
    <Popover>
      {/* Trigger */}
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="group rounded-full px-3 py-1.5 flex items-center gap-2 bg-[#1b1b1b]/70 hover:bg-[#2a2a2a]/90 backdrop-blur-md border border-white/10 text-white text-sm transition-all duration-200 shadow-sm"
        >
          
            <Image
              src={user?.imageUrl ?? ""}
              alt="user-avatar"
              width={24}
              height={24}
              className="rounded-full w-6 h-6 border border-white/20"
            />
          
          <span className="font-medium tracking-wide group-hover:text-gray-200">
            {user?.name ?? "User"}
          </span>
        </motion.button>
      </PopoverTrigger>

      {/* Content */}
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[220px] p-3 rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1a1a]/95 to-[#0f0f0f]/95 backdrop-blur-xl shadow-2xl"
      >
        {/* User Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
   
            <Image
              src={user?.imageUrl ?? ""}
              alt="user-avatar"
              width={40}
              height={40}
              className="rounded-full border border-white/10"
            />
         
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {user?.name ?? "User"}
            </span>
            <span className="text-xs text-gray-400">
              {user?.plans ? `${user.plans} Plan` : "Free Plan"}
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col mt-2 space-y-1">
        
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1.5 rounded-md text-sm transition-all"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
