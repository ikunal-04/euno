"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Volume2, VolumeX, Phone, PhoneOff, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MetaBalls from "../MetaBalls";

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
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playTimeRef = useRef(0);

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
        if (typeof data.text === 'string' && data.text.trim().length > 0) {
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
            setCurrentAgentText(data.text);
          }
        }

        if (data.audio_data && (data.status === 'streaming' || data.status === 'complete')) {
          try {
            console.log('🔊 Received audio chunk:', data.audio_mime_type);

            const mime = (data.audio_mime_type || '').toLowerCase();
            const u8 = base64ToUint8Array(data.audio_data);

            if (mime.includes('audio/wav')) {
              const arr = new Uint8Array(u8.byteLength);
              arr.set(u8);
              const blob = new Blob([arr.buffer], { type: 'audio/wav' });
              const url = URL.createObjectURL(blob);

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

    connectWebSocket();
    await startAudioCapture();

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

    audioQueueRef.current = [];
    isPlayingRef.current = false;

    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
      playTimeRef.current = 0;
    }

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

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center relative overflow-hidden bg-[#141413] transition-all">
      {/* MetaBalls background */}
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

      {/* Centered Control Buttons */}
      <div className="absolute bottom-12 flex items-center justify-center gap-8">
        {/* Mic Button with Ripple Effect */}
        <button
          onClick={isCallActive ? handleEndCall : handleStartCall}
          className="relative group"
        >
          {/* Ripple rings when recording */}
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ripple" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ripple" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ripple" style={{ animationDelay: '1s' }} />
            </>
          )}
          
          {/* Main button */}
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isRecording
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/50 scale-110"
              : "bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-slate-900/50 hover:scale-105"
          }`}>
            {isRecording ? (
              <Mic className="h-6 w-6 text-white" strokeWidth={2.5} />
            ) : (
              <Mic className="h-6 w-6 text-slate-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
            )}
          </div>

          {/* Button label */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs text-slate-400 font-light">
              {isRecording ? 'Recording' : 'Start'}
            </span>
          </div>
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="relative group"
        >
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-red-500 hover:to-red-600 shadow-2xl shadow-slate-900/50 hover:shadow-red-500/50 hover:scale-105">
            <X className="h-7 w-7 text-slate-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>

          {/* Button label */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs text-slate-400 font-light">End Call</span>
          </div>
        </button>
      </div>
    </div>
  );
};
