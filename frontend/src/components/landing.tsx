"use client"

import React from "react";
import NavLanding from "@/components/nav-landing";
import { signIn } from "next-auth/react";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";

// Elegant serif font for the main heading
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Sleek and modern sans-serif for body and UI elements
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function EunoLandingPage() {
  return (
    <div className="min-h-screen bg-[#121211] text-[#f8f8f6] flex flex-col overflow-hidden">
      <NavLanding />

      <div className="flex flex-1 flex-col lg:flex-row items-center justify-between max-w-[1300px] mx-auto w-full px-6 lg:px-16 py-20 gap-12">
        {/* ===== Left Section ===== */}
        <div className="flex-1 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-8 z-10">
          {/* Heading */}
          <h1
            className={`${cormorant.className} text-[3rem] md:text-[4rem] leading-[1.1] font-semibold tracking-tight`}
          >
            <span className="block font-semibold text-[#f5f4f0]/85">
              Where thoughts
            </span>
            <span className="block text-[#f5f4f0] font-bold">
              find their voice.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`${jakarta.className} text-base md:text-lg text-[#f5f4f0]/70 max-w-sm leading-relaxed`}
          >
            euno is your private companion for reflection, conversation, and gentle guidance.
          </p>

          {/* Sign In Card */}
          <div className="bg-[#1a1a19]/70 border border-[#2a2928] rounded-2xl p-7 shadow-xl w-[320px] backdrop-blur-sm">
            <button
              onClick={() => signIn("google")}
              className={`${jakarta.className} w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#121211] border border-[#2a2928] rounded-xl text-base font-medium text-[#f5f4f0] 
                transition-all duration-300 hover:bg-[#1c1b1a] hover:border-[#3a3938] hover:shadow-[0_0_25px_rgba(245,244,240,0.08)]`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        {/* ===== Right Section - Video ===== */}
        <div className="flex-1 flex justify-center lg:justify-end w-full relative">
          <div className="relative w-full h-[65vh] lg:h-[80vh] max-w-none lg:max-w-[720px] overflow-hidden rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <video
              className="absolute inset-0 w-full h-full object-cover object-center rounded-3xl"
              src="/video.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#121211]/40 to-transparent rounded-3xl pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}