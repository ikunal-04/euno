import { create } from "zustand";
import { createMessage } from "@/lib/messages/server";

export interface MessagesRecord {
  id: string;
  userId: string;
  userMessage: string;
  agentMessage: string;
  createdAt: Date;
}

interface VoiceChatState {
  // UI state
  isCallActive: boolean;
  currentUserText: string;
  currentAgentText: string;
  isMuted: boolean;
  volume: number;
  isRecording: boolean;
  isPlaying: boolean;

  // Accumulator for pairing user+agent final messages
  pendingUserFinal: { userId?: string; text: string } | null;

  // actions
  setIsCallActive: (value: boolean) => void;
  setCurrentUserText: (text: string) => void;
  setCurrentAgentText: (text: string) => void;
  setIsMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setIsRecording: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;

  onUserFinal: (userId: string, text: string) => void;
  onAgentFinal: (userId: string, text: string) => void;
}

export const useVoiceChatStore = create<VoiceChatState>((set, get) => ({
  isCallActive: false,
  currentUserText: "",
  currentAgentText: "",
  isMuted: false,
  volume: 0.8,
  isRecording: false,
  isPlaying: false,

  pendingUserFinal: null,

  setIsCallActive: (value) => set({ isCallActive: value }),
  setCurrentUserText: (text) => set({ currentUserText: text }),
  setCurrentAgentText: (text) => set({ currentAgentText: text }),
  setIsMuted: (value) => set({ isMuted: value }),
  setVolume: (value) => set({ volume: value }),
  setIsRecording: (value) => set({ isRecording: value }),
  setIsPlaying: (value) => set({ isPlaying: value }),

  onUserFinal: (userId, text) => {
    createMessage({
      userId,
      message: text,
      role: "user",
    });
    set({ pendingUserFinal: { userId, text } });
  },
  onAgentFinal: (userId, text) => {
    const pending = get().pendingUserFinal;
    if (!pending || !pending.text) return null;
    // Prefer userId from pending user final, fallback to provided
    const finalUserId = pending.userId || userId;
    createMessage({
        userId: finalUserId || "",
        message: text,
        role: "assistant",
    });
    // Clear pending once consumed
    set({ pendingUserFinal: null });
  },
}));
