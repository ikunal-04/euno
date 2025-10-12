"use client";

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
    <nav
      className="
        fixed top-0 left-0 right-0 z-50 
        flex items-center justify-between 
        px-5 sm:px-8 md:px-10 py-3 sm:py-4 
        backdrop-blur-md bg-[#141413] 
    
      "
    >
      {/* === Left: Logo === */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Desktop: Full logo with text */}
        <div className="hidden md:flex scale-110">
          <Logo />
        </div>

        {/* Mobile: Logo icon only (slightly larger for visibility) */}
        <div className="md:hidden flex items-center">
          <Image
            src="/logo.svg"
            alt="logo"
            width={40}
            height={40}
            className="rounded-full border border-white/20 shadow-sm"
            priority
          />
        </div>
      </div>

      {/* === Center: Pricing Button (visible on all screens now) === */}
      <div className="absolute left-1/2 -translate-x-1/2 flex">
        <div className="scale-[0.9] sm:scale-100">
          <PricingButton />
        </div>
      </div>

      {/* === Right: User settings or Sign-in button === */}
      <div className="flex items-center">
        {user ? (
          <UserSettings />
        ) : (
          <button
            onClick={() => signIn("google")}
            className="
              flex items-center gap-2 
              px-4 sm:px-5 py-2 sm:py-2.5 
              rounded-xl sm:rounded-2xl 
              bg-gray-900/90 hover:bg-gray-800 
              text-white text-sm font-medium 
              transition-all duration-300 
              shadow-lg shadow-gray-900/20 
              hover:shadow-gray-900/30
              active:scale-95
            "
          >
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
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
            <span className="capitalize hidden xs:inline">sign in</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBarMain;
