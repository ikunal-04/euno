"use client";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/store/user";

export const UserSettings = () => {
  const { user } = useUserStore();

  return (
    <Popover>
      <PopoverTrigger className="rounded-md p-1.5 flex items-center justify-center gap-2 text-sm transition-all duration-200 cursor-pointer text-white">
        {user?.imageUrl && (
          <Image
            src={user.imageUrl}
            alt="user-avatar"
            width={20}
            height={20}
            className="rounded-full w-5 h-5"
          />
        )}
        <span>{user?.name ?? "User"}</span>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        className="bg-gray-700 w-fit min-w-40 flex flex-col text-sm p-1 gap-1"
      >
        <div className="w-[200px] p-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Plan</span>
            <span className="text-white font-medium">
              {user?.plans ? user.plans : "Free"}
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 w-full px-2 py-1 rounded-md cursor-pointer transition-all duration-200 bg-gray-400 hover:bg-gray-500"
        >
          <LogOut size={12} />
          <span>Log out</span>
        </button>
      </PopoverContent>
    </Popover>
  );
};
