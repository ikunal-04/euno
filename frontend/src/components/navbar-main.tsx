"use client";

import { motion } from "framer-motion";
import React from "react";
import { signIn } from "next-auth/react";
import PricingButton from "@/components/pricingButton";
import { UserSettings } from "./user-settings";
import { useUserStore } from "@/store/useUser";
import Logo from "@/components/logo";
import Image from "next/image";

const NavBarMain = () => {
  const user = useUserStore((state) => state.user);

  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 bg-transparent">
        {/* Left: Logo */}
        <div className="flex items-center">
          {/* Desktop: full logo with name */}
          <div className="hidden md:flex">
            <Logo />
          </div>

          {/* Mobile: only logo icon (without text) */}
          <div className="md:hidden flex items-center pl-2">
            <Image 
              src={"/logo.svg"}
              alt="user-avatar"
              width={24}
              height={24}
              className="rounded-full w-6 h-6 border border-white/20"
              />
          </div>
        </div>

        {/* Center: View Plans button */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <PricingButton />
        </div>

        {/* Right: User settings or Sign in */}
        <div>
          {user ? (
            <UserSettings />
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-6 py-2.5 rounded-2xl bg-gray-900/95 hover:bg-gray-800 text-white text-sm font-normal transition-all duration-300 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/25"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                sign in
              </div>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavBarMain;
