"use client";

import { ChevronDown, LogOut, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useUserStore } from "@/store/useUser";
import { useIsMobile } from "@/hooks/use-mobile";

function initialsOf(name?: string | null) {
  if (!name) return "E";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function UserAvatar({ size }: { size: "sm" | "lg" }) {
  const user = useUserStore((s) => s.user);
  const dims = size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-sm";

  return (
    <Avatar className={`${dims} border border-white/15`}>
      {user?.imageUrl && (
        <AvatarImage
          src={user.imageUrl}
          alt={user?.name ?? "Your avatar"}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback className="bg-[#a8e3ff]/15 font-medium text-[#cdeeff]">
        {initialsOf(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export const UserSettings = () => {
  const user = useUserStore((s) => s.user);
  const isMobile = useIsMobile();
  const isPro = user?.plans === "PRO";
  const firstName = user?.name?.split(" ")[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Account menu"
          className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5 text-sm text-white/85 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.08]"
        >
          <UserAvatar size="sm" />
          {!isMobile && <span className="font-medium">{firstName ?? "Account"}</span>}
          <ChevronDown className="h-3.5 w-3.5 text-white/40 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={10}
        className="w-[260px] rounded-2xl border border-white/10 bg-[#1a1918]/95 p-0 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        {/* Identity */}
        <div className="flex items-center gap-3 p-4">
          <UserAvatar size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? "User"}</p>
            <p className="truncate text-xs text-white/40">{user?.email}</p>
          </div>
        </div>

        {/* Plan */}
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className={`h-3.5 w-3.5 ${isPro ? "text-[#a8e3ff]" : "text-white/35"}`} />
            <span className="text-xs font-medium text-white/75">
              {isPro ? "Pro plan" : "Free plan"}
            </span>
          </div>
          {!isPro && (
            <Link
              href="/price"
              className="rounded-full bg-[#a8e3ff] px-2.5 py-1 text-[11px] font-semibold text-[#10222c] transition-colors hover:bg-[#bfeaff]"
            >
              Upgrade
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-white/[0.07] p-1.5">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-300/90 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
