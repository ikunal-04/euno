"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, PhoneOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import MetaBalls from "../MetaBalls";
import { useVoiceChatStore } from "@/store/voice-chat";
import { useUserStore } from "@/store/useUser";

type WSConnectionState = "disconnected" | "connecting" | "connected" | "failed";

const DEFAULT_VOICE_WS_URL =
  process.env.NODE_ENV === "development"
    ? "ws://localhost:8000/ws/audio"
    : "wss://api.euno.live/ws/audio";

const VOICE_WS_URL = process.env.NEXT_PUBLIC_VOICE_WS_URL || DEFAULT_VOICE_WS_URL;
const PLAYBACK_SAMPLE_RATE = 48000;
const MAX_RECONNECT_ATTEMPTS = 3;

export const VoiceChat = () => {
  const isCallActive = useVoiceChatStore((s) => s.isCallActive);
  const setIsCallActive = useVoiceChatStore((s) => s.setIsCallActive);
  const currentUserText = useVoiceChatStore((s) => s.currentUserText);
  const setCurrentUserText = useVoiceChatStore((s) => s.setCurrentUserText);
  const currentAgentText = useVoiceChatStore((s) => s.currentAgentText);
  const setCurrentAgentText = useVoiceChatStore((s) => s.setCurrentAgentText);
  const isMuted = useVoiceChatStore((s) => s.isMuted);
  const setIsMuted = useVoiceChatStore((s) => s.setIsMuted);
  const volume = useVoiceChatStore((s) => s.volume);
  const isPlaying = useVoiceChatStore((s) => s.isPlaying);
  const setIsPlaying = useVoiceChatStore((s) => s.setIsPlaying);
  const remainingMessages = useVoiceChatStore((s) => s.remainingMessages);
  const setRemainingMessages = useVoiceChatStore((s) => s.setRemainingMessages);

  const user = useUserStore((s) => s.user);

  const [wsConnectionState, setWsConnectionState] = useState<WSConnectionState>("disconnected");

  // --- connection / capture refs ---
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const isMutedRef = useRef(false);
  const callActiveRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAudioRef = useRef<ArrayBuffer[]>([]);

  // --- playback refs ---
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const playTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const agentDoneRef = useRef(true);

  // ---------------------------------------------------------------- playback

  const getPlaybackChain = useCallback(() => {
    if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
      const ctx = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      playbackCtxRef.current = ctx;
      gainNodeRef.current = gain;
      playTimeRef.current = 0;
    }
    return { ctx: playbackCtxRef.current, gain: gainNodeRef.current as GainNode };
  }, []);

  const schedulePcmChunk = useCallback(
    (base64Audio: string) => {
      const { ctx, gain } = getPlaybackChain();
      if (ctx.state === "suspended") void ctx.resume();

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const samples = new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
      if (samples.length === 0) return;
      const floats = new Float32Array(samples.length);
      for (let i = 0; i < samples.length; i++) floats[i] = samples[i] / 32768;

      const buffer = ctx.createBuffer(1, floats.length, PLAYBACK_SAMPLE_RATE);
      buffer.getChannelData(0).set(floats);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);

      const startAt = Math.max(ctx.currentTime, playTimeRef.current);
      source.start(startAt);
      playTimeRef.current = startAt + buffer.duration;

      activeSourcesRef.current.add(source);
      setIsPlaying(true);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
        if (activeSourcesRef.current.size === 0 && agentDoneRef.current) {
          setIsPlaying(false);
        }
      };
    },
    [getPlaybackChain, setIsPlaying],
  );

  const stopPlayback = useCallback(() => {
    for (const source of activeSourcesRef.current) {
      try {
        source.onended = null;
        source.stop();
      } catch {}
    }
    activeSourcesRef.current.clear();
    playTimeRef.current = 0;
    setIsPlaying(false);
  }, [setIsPlaying]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // ------------------------------------------------------------- websocket

  const handleServerMessage = useCallback(
    (raw: string) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      switch (data.type) {
        case "ready":
          setWsConnectionState("connected");
          setRemainingMessages(
            typeof data.remaining === "number" ? data.remaining : null,
          );
          break;

        case "transcript":
          setCurrentUserText(String(data.text ?? ""));
          break;

        case "user_message":
          setCurrentUserText("");
          break;

        case "agent_text":
          agentDoneRef.current = false;
          setCurrentAgentText(String(data.text ?? ""));
          break;

        case "agent_audio":
          if (typeof data.audio === "string" && data.audio.length > 0) {
            try {
              schedulePcmChunk(data.audio);
            } catch (e) {
              console.error("Audio playback failed:", e);
            }
          }
          break;

        case "agent_done":
          agentDoneRef.current = true;
          if (activeSourcesRef.current.size === 0) setIsPlaying(false);
          break;

        case "interrupt":
          agentDoneRef.current = true;
          stopPlayback();
          break;

        case "limit":
          if (typeof data.remaining === "number") {
            setRemainingMessages(data.remaining);
          }
          break;

        case "limit_reached":
          setRemainingMessages(0);
          toast.error("Daily limit reached", {
            description: "Upgrade to Pro for unlimited conversations.",
            action: { label: "Upgrade", onClick: () => (window.location.href = "/price") },
          });
          break;

        case "error":
          toast.error("Something went wrong", {
            description: String(data.message ?? "Please try again."),
          });
          break;
      }
    },
    [schedulePcmChunk, stopPlayback, setCurrentAgentText, setCurrentUserText, setIsPlaying, setRemainingMessages],
  );

  const connectWebSocket = useCallback(async () => {
    setWsConnectionState("connecting");

    let token: string | null = null;
    try {
      const res = await fetch("/api/voice-token");
      if (res.ok) token = (await res.json()).token;
    } catch {}

    if (!token) {
      setWsConnectionState("failed");
      toast.error("Couldn't start the call", {
        description: "Please sign in again and retry.",
      });
      return false;
    }

    const wsUrl = new URL(VOICE_WS_URL);
    wsUrl.searchParams.set("token", token);

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      // Flush audio captured while connecting.
      for (const chunk of pendingAudioRef.current) ws.send(chunk);
      pendingAudioRef.current = [];
    };

    ws.onmessage = (event) => handleServerMessage(event.data);

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return;
      wsRef.current = null;

      if (event.code === 4003) {
        setWsConnectionState("failed");
        toast.error("Session expired", { description: "Please sign in again." });
        endCall();
        return;
      }

      if (callActiveRef.current && event.code !== 1000) {
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          setWsConnectionState("connecting");
          reconnectTimeoutRef.current = setTimeout(
            () => void connectWebSocket(),
            1000 * reconnectAttemptsRef.current,
          );
        } else {
          setWsConnectionState("failed");
          toast.error("Connection lost", {
            description: "Couldn't reach the voice service. Please try again.",
          });
          endCall();
        }
      } else {
        setWsConnectionState("disconnected");
      }
    };

    ws.onerror = () => {
      // onclose follows and handles retry/teardown.
    };

    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleServerMessage]);

  // ---------------------------------------------------------- audio capture

  const startAudioCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 16000 });
    captureCtxRef.current = ctx;
    await ctx.audioWorklet.addModule("/pcm16-processor.js");

    const source = ctx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(ctx, "pcm16-writer");
    workletNodeRef.current = worklet;

    worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const buffer = event.data;
      if (!buffer || isMutedRef.current) return;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(buffer);
      } else if (callActiveRef.current) {
        pendingAudioRef.current.push(buffer);
        if (pendingAudioRef.current.length > 50) pendingAudioRef.current.shift();
      }
    };

    source.connect(worklet);
  }, []);

  const stopAudioCapture = useCallback(() => {
    workletNodeRef.current?.port.close();
    workletNodeRef.current = null;
    if (captureCtxRef.current) {
      try {
        void captureCtxRef.current.close();
      } catch {}
      captureCtxRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pendingAudioRef.current = [];
  }, []);

  // ------------------------------------------------------------- call flow

  const startCall = async () => {
    if (callActiveRef.current) return;
    callActiveRef.current = true;
    setIsCallActive(true);
    agentDoneRef.current = true;
    reconnectAttemptsRef.current = 0;

    try {
      await startAudioCapture();
    } catch {
      toast.error("Microphone access needed", {
        description: "Allow microphone access to talk with Euno.",
      });
      endCall();
      return;
    }

    const ok = await connectWebSocket();
    if (!ok) endCall();
  };

  const endCall = useCallback(() => {
    callActiveRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      try {
        ws.close(1000);
      } catch {}
    }

    stopAudioCapture();
    stopPlayback();
    if (playbackCtxRef.current) {
      try {
        void playbackCtxRef.current.close();
      } catch {}
      playbackCtxRef.current = null;
      gainNodeRef.current = null;
    }

    setIsCallActive(false);
    setIsMuted(false);
    isMutedRef.current = false;
    setCurrentUserText("");
    setCurrentAgentText("");
    setWsConnectionState("disconnected");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudioCapture, stopPlayback]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
  };

  useEffect(() => {
    return () => endCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- render

  const isConnecting = wsConnectionState === "connecting";
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#141413]">
      <div className="absolute inset-0">
        <MetaBalls
          color="#a8e3ff"
          cursorBallColor="#ffffff"
          cursorBallSize={2}
          ballCount={20}
          animationSize={60}
          enableMouseInteraction={false}
          enableTransparency={true}
          clumpFactor={1}
          speed={isPlaying ? 1.0 : 0.35}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#141413_85%)]" />

      {/* Top status */}
      <div className="absolute top-20 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        {isCallActive && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-1.5 backdrop-blur-md">
            {isConnecting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
                <span className="text-xs text-amber-200">Connecting…</span>
              </>
            ) : wsConnectionState === "connected" ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-200">
                  {isPlaying ? "Euno is talking" : "Listening"}
                </span>
              </>
            ) : (
              <span className="text-xs text-red-300">Disconnected</span>
            )}
          </div>
        )}
        {isCallActive && remainingMessages !== null && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-black/40 px-3 py-1 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-[#a8e3ff]" />
            <span className="text-[11px] text-white/60">
              {remainingMessages} free {remainingMessages === 1 ? "message" : "messages"} left today
            </span>
          </div>
        )}
      </div>

      {/* Captions */}
      <div className="absolute bottom-44 left-1/2 z-10 w-full max-w-xl -translate-x-1/2 px-6 text-center">
        {currentAgentText && (
          <p className="mx-auto text-balance text-base leading-relaxed text-white/90 sm:text-lg">
            {currentAgentText}
          </p>
        )}
        {!currentAgentText && currentUserText && (
          <p className="mx-auto text-balance text-sm leading-relaxed text-white/45 sm:text-base">
            {currentUserText}
          </p>
        )}
        {!isCallActive && (
          <div className="space-y-3">
            <h1 className="text-2xl font-light text-white/90 sm:text-3xl">
              {firstName ? `Hey ${firstName}.` : "Hey."}
            </h1>
            <p className="text-sm text-white/50 sm:text-base">
              Tap the mic whenever you feel like talking.
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-5">
        {!isCallActive ? (
          <button
            onClick={startCall}
            aria-label="Start talking"
            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#a8e3ff] to-[#6db8dd] shadow-[0_0_50px_rgba(168,227,255,0.35)] transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <Mic className="h-8 w-8 text-[#10222c]" strokeWidth={2.25} />
            <span className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-white/50">
              Start talking
            </span>
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className={`flex h-16 w-16 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                isMuted
                  ? "border-red-400/40 bg-red-500/20 text-red-300"
                  : "border-white/15 bg-white/10 text-white"
              }`}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            <button
              onClick={endCall}
              aria-label="End call"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.35)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <PhoneOff className="h-7 w-7 text-white" strokeWidth={2.25} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
