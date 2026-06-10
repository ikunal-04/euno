import { create } from "zustand";

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

interface VoiceChatState {
  isCallActive: boolean;
  currentUserText: string;
  currentAgentText: string;
  isMuted: boolean;
  volume: number;
  isPlaying: boolean;
  transcript: TranscriptEntry[];
  remainingMessages: number | null; // null = unlimited / unknown

  setIsCallActive: (value: boolean) => void;
  setCurrentUserText: (text: string) => void;
  setCurrentAgentText: (text: string) => void;
  setIsMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  addTranscript: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
  setRemainingMessages: (value: number | null) => void;
}

export const useVoiceChatStore = create<VoiceChatState>((set) => ({
  isCallActive: false,
  currentUserText: "",
  currentAgentText: "",
  isMuted: false,
  volume: 0.8,
  isPlaying: false,
  transcript: [],
  remainingMessages: null,

  setIsCallActive: (value) => set({ isCallActive: value }),
  setCurrentUserText: (text) => set({ currentUserText: text }),
  setCurrentAgentText: (text) => set({ currentAgentText: text }),
  setIsMuted: (value) => set({ isMuted: value }),
  setVolume: (value) => set({ volume: value }),
  setIsPlaying: (value) => set({ isPlaying: value }),
  addTranscript: (entry) =>
    set((s) => ({ transcript: [...s.transcript.slice(-49), entry] })),
  clearTranscript: () => set({ transcript: [] }),
  setRemainingMessages: (value) => set({ remainingMessages: value }),
}));
