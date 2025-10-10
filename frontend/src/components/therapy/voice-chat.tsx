"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Volume2, VolumeX, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/audio");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "transcription") {
        setCurrentUserText(data.text);

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

      if (data.type === "agent_response") {
        if (typeof data.text === "string" && data.text.trim().length > 0) {
          const agentMessage: Message = {
            id: `agent-${Date.now()}`,
            type: "agent",
            text: data.text,
            timestamp: new Date(),
          };
          setCurrentAgentText("");
        }

        if (data.audio_data) {
          try {
            const mimeRaw: string | undefined = data.audio_mime_type;
            const mime = (mimeRaw || "").toLowerCase();
            const byteArray = base64ToUint8Array(data.audio_data);

            const buf = new ArrayBuffer(byteArray.byteLength);
            new Uint8Array(buf).set(byteArray);

            let blob: Blob;

            if (mime.includes("linear16")) {
              const sampleRate = parseSampleRateFromMime(mime) ?? 48000;
              const channels = parseChannelsFromMime(mime) ?? 1;
              const wavAb = buildWavFromPCM16(
                new Uint8Array(buf),
                sampleRate,
                channels
              );
              blob = new Blob([wavAb], { type: "audio/wav" });
            } else if (mime.includes("wav")) {
              blob = new Blob([buf], { type: "audio/wav" });
            } else if (mime.includes("pcm")) {
              const wavAb = buildWavFromPCM16(new Uint8Array(buf), 48000, 1);
              blob = new Blob([wavAb], { type: "audio/wav" });
            } else {
              blob = new Blob([buf], { type: mimeRaw || "audio/mpeg" });
            }

            let url = URL.createObjectURL(blob);

            if (audioPlaybackRef.current) {
              try {
                audioPlaybackRef.current.pause();
              } catch {}
              try {
                URL.revokeObjectURL(audioPlaybackRef.current.src);
              } catch {}
            }

            const audio = new Audio(url);
            audioPlaybackRef.current = audio;
            audio.volume = isMuted ? 0 : volume;
            setIsPlaying(true);

            audio.onended = () => {
              setIsPlaying(false);
              try {
                URL.revokeObjectURL(url);
              } catch {}
            };

            audio.onerror = async (error) => {
              console.error("Audio playback error:", error);
              setIsPlaying(false);
              try {
                URL.revokeObjectURL(url);
              } catch {}
            };

            console.log("▶️ Playing agent response");
            void audio.play();
          } catch (e) {
            console.error("Failed to play agent audio:", e);
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
        },
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
    } catch {}
    workletNodeRef.current = null;
    sourceNodeRef.current = null;

    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      try {
        ctx.close();
      } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartCall = async () => {
    setIsCallActive(true);
    setIsRecording(true);
    connectWebSocket();
    await startAudioCapture();
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    setIsPlaying(false);
    setCurrentUserText("");
    setCurrentAgentText("");
    stopAudioCapture();
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

  function buildWavFromPCM16(
    pcm16: Uint8Array,
    sampleRate = 16000,
    channels = 1
  ): ArrayBuffer {
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcm16.byteLength;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
    new Uint8Array(buffer, 44).set(pcm16);
    return buffer;
  }

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  }

  function parseSampleRateFromMime(mime: string): number | null {
    const lower = mime.toLowerCase();
    const rateMatch = lower.match(/(?:rate|samplerate)\s*=\s*(\d{3,6})/);
    if (rateMatch) {
      const n = parseInt(rateMatch[1], 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
  }

  function parseChannelsFromMime(mime: string): number | null {
    const lower = mime.toLowerCase();
    const channelsMatch = lower.match(/channels?\s*=\s*(\d+)/);
    if (channelsMatch) {
      const n = parseInt(channelsMatch[1], 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center relative overflow-hidden bg-[#141413] transition-all">
      {/* Gradient pulse background */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          isRecording || isPlaying ? "opacity-100 animate-pulse-glow" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle at center, rgba(76,154,255,0.15), rgba(20,20,19,0.9))",
        }}
      />

      <div className="relative z-10 flex flex-col items-center space-y-8">
        <AnimatePresence mode="wait">
          {!isCallActive ? (
            /* Single Circle - Start Call */
            <motion.div
              key="single-circle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-4"
            >
              <Button
                onClick={handleStartCall}
                size="lg"
                className="rounded-full w-36 h-36 transition-all duration-500 shadow-[0_0_60px_rgba(59,130,246,0.6)] bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:scale-105"
              >
                <Phone className="h-10 w-10 text-white" />
              </Button>
              <div className="text-center text-gray-400 text-sm">
                Tap to start
              </div>
            </motion.div>
          ) : (
            /* Three Circles - Active Call */
            <motion.div
              key="three-circles"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-8"
            >
              {/* Left Circle - User Speaking */}
              <motion.div
                className="flex flex-col items-center space-y-3"
                animate={
                  isRecording
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div
                  className={`rounded-full w-28 h-28 flex items-center justify-center transition-all duration-500 ${
                    isRecording
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_0_40px_rgba(34,197,94,0.7)]"
                      : "bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_0_20px_rgba(100,100,100,0.3)]"
                  }`}
                >
                  <Mic className={`h-8 w-8 ${isRecording ? "text-white" : "text-gray-400"}`} />
                </div>
                <div className="text-center text-gray-400 text-xs">
                  You
                </div>
              </motion.div>

              {/* Center Circle - End Call */}
              <motion.div
                className="flex flex-col items-center space-y-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleEndCall}
                  size="lg"
                  className="rounded-full w-32 h-32 transition-all duration-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                >
                  <Phone className="h-9 w-9 text-white rotate-[135deg]" />
                </Button>
                <div className="text-center text-gray-400 text-xs">
                  End Call
                </div>
              </motion.div>

              {/* Right Circle - AI Speaking */}
              <motion.div
                className="flex flex-col items-center space-y-3"
                animate={
                  isPlaying
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div
                  className={`rounded-full w-28 h-28 flex items-center justify-center transition-all duration-500 ${
                    isPlaying
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.7)]"
                      : "bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_0_20px_rgba(100,100,100,0.3)]"
                  }`}
                >
                  <Volume2 className={`h-8 w-8 ${isPlaying ? "text-white" : "text-gray-400"}`} />
                </div>
                <div className="text-center text-gray-400 text-xs">
                  AI
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume controls - only show when call is active */}
        {isCallActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-3 mt-4"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleMute}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-[#232322]"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-blue-400"
            />
          </motion.div>
        )}
      </div>

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};