"use client";

import React, { useState } from "react";
import NavLanding from "@/components/nav-landing";
import { signIn } from "next-auth/react";
import { DM_Sans } from "next/font/google";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function EunoLandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const testEmail = "test@example.com";
    const testPassword = "test123";

    if (email === testEmail && password === testPassword) {
      await signIn("credentials", {
        email: testEmail,
        password: testPassword,
        redirect: true,
        callbackUrl: "/",
      });
    } else {
      alert("Invalid credentials. Use: test@example.com / test123");
    }

    setIsLoading(false);
  };

  return (
    <div className="h-[90vh] w-full bg-[#141413] text-[#f8f8f6] flex flex-col overflow-hidden">
      <NavLanding />

      <div
        className="
          flex flex-1 flex-col lg:flex-row 
          items-center justify-center lg:justify-between 
          max-w-[1300px] mx-auto w-full 
          pt-8
          px-6 lg:px-16 py-0 gap-8 lg:gap-12
        "
      >
        {/* ===== Left Section ===== */}
        <div
          className="
            flex-1 flex flex-col justify-center 
            items-center lg:items-start 
            text-center lg:text-left 
            space-y-6 z-10
          "
        >
          <h1
            className={`text-[2rem] sm:text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.1] font-delius tracking-tight`}
          >
            <span className="block text-[#f5f4f0]/90">Where thoughts</span>
            <span className="block text-[#f5f4f0] font-semibold">
              find their voice.
            </span>
          </h1>

          <p
            className={`${dmSans.className} text-xs sm:text-sm md:text-base lg:text-lg text-[#f5f4f0]/70 max-w-sm leading-relaxed`}
          >
            Euno is your private companion for reflection, conversation, and
            gentle guidance.
          </p>

          <button
            onClick={() => signIn("google")}
            className={`${dmSans.className} flex items-center justify-center gap-3 px-4 sm:px-5 py-2 sm:py-3 w-[240px] sm:w-[280px] md:w-[320px] bg-[#121211] border border-[#2a2928] rounded-xl text-xs sm:text-sm md:text-base font-medium text-[#f5f4f0] shadow-xl hover:bg-black transition-all duration-300`}
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

          <Separator className="bg-white/30 w-[80%] sm:w-[60%]" />

          <form
            onSubmit={handleTestLogin}
            className="flex flex-col gap-3 w-[80%] sm:w-[280px]"
          >
            <div className="flex flex-col gap-1.5 w-full">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="test123"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </div>

        {/* ===== Right Section - Video (Hidden on small screens) ===== */}
        <div className="hidden pt-32 lg:flex flex-1 justify-center lg:justify-end w-full h-full relative">
          <div className="relative w-full h-[90%] max-w-[720px] overflow-hidden rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
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
