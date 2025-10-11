"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, X } from "lucide-react";
import MetaBalls from "../MetaBalls";
import { 
  Smile, 
  Frown, 
  HeartPulse, 
  Angry as AngryIcon, // Renamed to avoid conflicts
  Feather, 
  Sparkles 
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "agent";
  text: string;
  timestamp: Date;
}

export const VoiceChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentUserText, setCurrentUserText] = useState("");
  const [currentAgentText, setCurrentAgentText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMoodMenuOpen, setIsMoodMenuOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playTimeRef = useRef(0);

  // Get responsive MetaBalls config based on screen size
  const [metaBallConfig, setMetaBallConfig] = useState({
    ballCount: 20,
    animationSize: 70,
    cursorBallSize: 2
  });

  useEffect(() => {
    const updateMetaBallConfig = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        // Mobile: fewer balls, smaller animation
        setMetaBallConfig({ ballCount: 12, animationSize: 40, cursorBallSize: 1.5 });
      } else if (width < 1024) {
        // Tablet: medium configuration
        setMetaBallConfig({ ballCount: 16, animationSize: 55, cursorBallSize: 2 });
      } else if (width < 1440) {
        // Desktop: default configuration
        setMetaBallConfig({ ballCount: 20, animationSize: 70, cursorBallSize: 2 });
      } else {
        // Large screens: more balls, larger animation
        setMetaBallConfig({ ballCount: 25, animationSize: 85, cursorBallSize: 2.5 });
      }
    };

    // Initial setup
    updateMetaBallConfig();

    // Update on resize
    window.addEventListener('resize', updateMetaBallConfig);
    return () => window.removeEventListener('resize', updateMetaBallConfig);
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket('wss://api.euno.live/ws/audio');

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "transcription") {
        setCurrentUserText(data.text);

        console.log("🗣️ Transcription:", data.text, "Final:", data.is_final);

        // If transcription is final, add to messages
        if (data.is_final) {
          const userMessage: Message = {
            id: `user-${Date.now()}`,
            type: "user",
            text: data.text,
            timestamp: new Date(),
          };
          setCurrentUserText("");
        }
      }

      if (data.type === 'agent_response') {
        // Handle text response
        if (typeof data.text === 'string' && data.text.trim().length > 0) {
          // Only add to messages if it's the final response
          if (data.is_final) {
            const agentMessage: Message = {
              id: `agent-${Date.now()}`,
              type: "agent",
              text: data.text,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, agentMessage]);
            setCurrentAgentText("");
          } else {
            // Show streaming text
            setCurrentAgentText(data.text);
          }
        }

        // Handle audio (both streaming and complete)
        if (data.audio_data && (data.status === 'streaming' || data.status === 'complete')) {
          try {
            console.log('🔊 Received audio chunk:', data.audio_mime_type);

            const mime = (data.audio_mime_type || '').toLowerCase();
            const u8 = base64ToUint8Array(data.audio_data);

            // Prefer WAV playback in browser per Deepgram guidance.
            if (mime.includes('audio/wav')) {
              const arr = new Uint8Array(u8.byteLength);
              arr.set(u8);
              const blob = new Blob([arr.buffer], { type: 'audio/wav' });
              const url = URL.createObjectURL(blob);

              // Stop previous element
              if (audioPlaybackRef.current) {
                try { audioPlaybackRef.current.pause(); } catch {}
                try { URL.revokeObjectURL(audioPlaybackRef.current.src); } catch {}
              }

              const audio = new Audio(url);
              audioPlaybackRef.current = audio;
              audio.volume = isMuted ? 0 : volume;
              setIsPlaying(true);

              audio.onended = () => {
                if (data.status === 'complete') setIsPlaying(false);
                try { URL.revokeObjectURL(url); } catch {}
              };
              audio.onerror = () => {
                console.error('Audio playback error for WAV');
                setIsPlaying(false);
                try { URL.revokeObjectURL(url); } catch {}
              };
              void audio.play();
            } else {
              // Fallback: raw PCM via WebAudio
              const int16 = new Int16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2);
              const f32 = new Float32Array(int16.length);
              for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768;

              const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
              audioCtxRef.current = ctx;

              const buf = ctx.createBuffer(1, f32.length, 48000);
              buf.getChannelData(0).set(f32);

              const src = ctx.createBufferSource();
              src.buffer = buf;
              src.connect(ctx.destination);

              const startAt = Math.max(ctx.currentTime, playTimeRef.current);
              src.start(startAt);
              playTimeRef.current = startAt + buf.duration;

              src.onended = () => {
                if (data.status === 'complete') setIsPlaying(false);
              };

              setIsPlaying(true);
            }

          } catch (e) {
            console.error('Failed to play streaming audio:', e);
            setIsPlaying(false);
          }
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/pcm16-processor.js");

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const workletNode = new AudioWorkletNode(audioContext, "pcm16-writer");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        const buffer = event.data;
        if (buffer && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(buffer);
        }
      };

      sourceNode.connect(workletNode);

    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopAudioCapture = () => {
    try {
      if (sourceNodeRef.current && workletNodeRef.current) {
        sourceNodeRef.current.disconnect(workletNodeRef.current);
      }
    } catch { }
    workletNodeRef.current = null;
    sourceNodeRef.current = null;

    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      try {
        ctx.close();
      } catch { }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartCall = async () => {
    setIsCallActive(true);
    setIsRecording(true);

    // Connect WebSocket
    connectWebSocket();

    // Start audio capture
    await startAudioCapture();

    // Add welcome message
    const welcomeMessage: Message = {
      id: `agent-welcome-${Date.now()}`,
      type: "agent",
      text: "Hello! I'm here to listen and support you. Feel free to share whatever is on your mind.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, welcomeMessage]);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    setIsPlaying(false);
    setCurrentUserText("");
    setCurrentAgentText("");

    // Clear audio queue and stop playing
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    // Close audio context
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
      playTimeRef.current = 0;
    }

    // Stop audio capture
    stopAudioCapture();

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      handleEndCall();
    };
  }, []);

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const moods = [
    { icon: Smile,      label: "Happy",   color: "yellow" },
    { icon: Frown,      label: "Sad",     color: "blue" },
    { icon: HeartPulse, label: "Anxious", color: "purple" },
    { icon: AngryIcon,  label: "Angry",   color: "red" },
    { icon: Feather,    label: "Calm",    color: "green" },
    { icon: Sparkles,   label: "Excited", color: "orange" }
  ];

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center relative overflow-hidden bg-[#141413] transition-all">
      {/* MetaBalls background - Responsive configuration */}
      <div className="absolute inset-0 w-full h-full">
        <MetaBalls
          
          color="#a8e3ff"
        cursorBallColor="#ffffff"
        cursorBallSize={2}
        ballCount={20}
        animationSize={60}
        enableMouseInteraction={false}
        enableTransparency={true}
        clumpFactor={1}
        speed={isPlaying ? 1.0 : 0.4}
        />
      </div>

      {/* Audio Waveform Visualization - Top Center */}
      {/* {(isRecording || isPlaying) && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 animate-fadeIn">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                isRecording ? 'bg-emerald-400' : 'bg-violet-400'
              }`}
              style={{
                height: '8px',
                animation: `waveform ${0.8 + (i % 5) * 0.1}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      )} */}

      {/* Status Card - Below Waveform */}
      {/* {(isRecording || isPlaying) && (
        <div className="absolute top-48 left-1/2 -translate-x-1/2 animate-fadeIn">
          <div className="px-6 py-3 bg-slate-900/80 backdrop-blur-xl rounded-full border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-3">
              {isRecording && (
                <>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  </div>
                  <span className="text-sm text-emerald-300 font-light tracking-wide">Listening</span>
                </>
              )}
              {isPlaying && !isRecording && (
                <>
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-violet-400 rounded-full animate-audioBar" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-4 bg-violet-400 rounded-full animate-audioBar" style={{ animationDelay: '100ms' }} />
                    <div className="w-1 h-3 bg-violet-400 rounded-full animate-audioBar" style={{ animationDelay: '200ms' }} />
                  </div>
                  <span className="text-sm text-violet-300 font-light tracking-wide">Agent Speaking</span>
                </>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* Mood Menu - Horizontal Style */}
      {/* Mood Menu - Horizontal & Responsive */}
      {isMoodMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setIsMoodMenuOpen(false)}
          />
          
          {/* Responsive Positioning:
            - The menu is positioned relative to the bottom controls.
            - `bottom-24` on mobile, `bottom-28` on small tablets, `bottom-32` on larger devices.
            - `w-[90vw]` ensures it doesn't touch screen edges on mobile, with a `max-w-md` for larger screens.
          */}
          <div className="absolute bottom-24 sm:bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-md z-50 animate-slideUp">
            <div className="p-3 sm:p-4 rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1a1a]/95 to-[#0f0f0f]/95 backdrop-blur-xl shadow-2xl">
              {/* Responsive Grid Layout:
                - `grid-cols-3` on very small screens.
                - `sm:grid-cols-6` on small screens and up, showing all moods in one row.
                - `gap-2` creates space between buttons.
              */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {moods.map((mood) => {
                   const Icon = mood.icon; // Get the icon component
                  return (
                    <button
                      key={mood.label}
                      onClick={() => {
                        console.log(`${mood.label} mood selected`);
                        setIsMoodMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all duration-200 hover:scale-110 hover:bg-${mood.color}-500/10 group aspect-square`}
                    >
                      {/* Responsive Icon Size */}
                            <Icon 
                              className={`h-6 w-6 sm:h-7 sm:w-7 mb-1 text-slate-300 group-hover:text-${mood.color}-400 transition-colors`} 
                              strokeWidth={1.5}
                            />
                      {/* Responsive Text Size */}
                      <span className="text-[10px] sm:text-xs text-slate-400 group-hover:text-white transition-colors whitespace-nowrap">
                        {mood.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Centered Control Buttons - Fully Responsive */}
      <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-14 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
        {/* Mic Button with Ripple Effect */}
        <button
          onClick={isCallActive ? handleEndCall : handleStartCall}
          className="relative group"
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {/* Ripple rings when recording */}
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ripple" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ripple" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ripple" style={{ animationDelay: '1s' }} />
            </>
          )}
          
          {/* Main button - Responsive sizing */}
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isRecording
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/50 scale-110"
              : "bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-slate-900/50 hover:scale-105"
          }`}>
            {isRecording ? (
              <Mic className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" strokeWidth={2.5} />
            ) : (
              <Mic className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-slate-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
            )}
          </div>

          {/* Button label - Responsive positioning */}
          <div className="absolute -bottom-6 sm:-bottom-7 md:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs sm:text-sm text-slate-400 font-light">
              {isRecording ? 'Recording' : 'Start'}
            </span>
          </div>
        </button>

        {/* Mood Button */}
        <button
          onClick={() => setIsMoodMenuOpen(!isMoodMenuOpen)}
          className="relative group"
          aria-label="Select Mood"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-indigo-500 hover:to-purple-600 shadow-2xl shadow-blue-800/50 hover:shadow-indigo-500/50 hover:scale-105">
            <Smile className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white transition-colors" strokeWidth={2.5} />
          </div>
          <div className="absolute -bottom-6 sm:-bottom-7 md:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs sm:text-sm text-slate-400 font-light">Mood</span>
          </div>
        </button>

        {/* End Call Button - Responsive sizing */}
        <button
          onClick={handleEndCall}
          className="relative group"
          aria-label="End Call"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-red-500 hover:to-red-600 shadow-2xl shadow-slate-900/50 hover:shadow-red-500/50 hover:scale-105">
            <X className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-slate-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>

          {/* Button label - Responsive positioning */}
          <div className="absolute -bottom-6 sm:-bottom-7 md:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs sm:text-sm text-slate-400 font-light">End Call</span>
          </div>
        </button>
      </div>

      <style jsx global>{`
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes waveform {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 40px;
          }
        }
        
        @keyframes audioBar {
          0%, 100% {
            height: 0.75rem;
          }
          50% {
            height: 1.25rem;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .animate-ripple {
          animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-audioBar {
          animation: audioBar 0.6s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        /* Ensure proper spacing on very small screens */
        @media (max-width: 380px) {
          .absolute.-bottom-6 {
            bottom: -1.25rem;
          }
        }
      `}</style>
    </div>
  );
};