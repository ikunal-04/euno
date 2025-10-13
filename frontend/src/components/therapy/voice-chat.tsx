"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import MetaBalls from "../MetaBalls";
import {
  Smile,
  Frown,
  HeartPulse,
  Angry as AngryIcon,
  Feather,
  Sparkles
} from "lucide-react";
import { useVoiceChatStore } from "@/store/voice-chat";
import { useUserStore } from "@/store/useUser";
import { generateSummary } from "@/lib/summary/server";
import { checkMessageLimit, incrementMessageCount, MessageLimitInfo } from "@/lib/message-limits/server";
import { toast } from "sonner";

// WebSocket connection states
type WSConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

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
  const setVolume = useVoiceChatStore((s) => s.setVolume);

  const isRecording = useVoiceChatStore((s) => s.isRecording);
  const setIsRecording = useVoiceChatStore((s) => s.setIsRecording);

  const isPlaying = useVoiceChatStore((s) => s.isPlaying);
  const setIsPlaying = useVoiceChatStore((s) => s.setIsPlaying);

  const onUserFinal = useVoiceChatStore((s) => s.onUserFinal);
  const onAgentFinal = useVoiceChatStore((s) => s.onAgentFinal);

  const userId = useUserStore((s) => s.user?.userId);

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
  const finalTranscriptRef = useRef<string>("");
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const summaryGeneratedRef = useRef<boolean>(false);
  const audioTracksRef = useRef<MediaStreamTrack[]>([]);
  const [messageLimitInfo, setMessageLimitInfo] = useState<MessageLimitInfo | null>(null);
  const toastShownRef = useRef(false);
  const lowToastShownRef = useRef(false);
  
  // New state for connection management
  const [wsConnectionState, setWsConnectionState] = useState<WSConnectionState>('disconnected');
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioBufferRef = useRef<ArrayBuffer[]>([]); // Buffer audio during connection
  const pendingAudioRef = useRef(false);

  const checkUserMessageLimit = async () => {
    if (!userId) return;

    try {
      const limitInfo = await checkMessageLimit(userId);
      setMessageLimitInfo(limitInfo);

      if (!limitInfo.canSendMessage && !toastShownRef.current) {
        toast.error("Daily Message Limit Reached", {
          description: `You've used all ${limitInfo.limit} messages for today.`,
          action: {
            label: "Upgrade",
            onClick: () => (window.location.href = "/price"),
          },
        });
        toastShownRef.current = true;
      } else if (
        !limitInfo.isPro &&
        limitInfo.remainingMessages <= 3 &&
        !lowToastShownRef.current
      ) {
        lowToastShownRef.current = true;
      }
    } catch (error) {
      console.error("Error checking message limit:", error);
    }
  };

  const handleDebouncedFinalTranscript = async (text: string) => {
    finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + text;

    if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);

    transcriptTimeoutRef.current = setTimeout(async () => {
      if (finalTranscriptRef.current && userId) {
        await incrementMessageCount(userId);
        const updatedLimitInfo = await checkMessageLimit(userId);
        setMessageLimitInfo(updatedLimitInfo);

        if (!updatedLimitInfo.canSendMessage) {
          toast.error("Daily Message Limit Reached", {
            description: `You've used all ${updatedLimitInfo.limit} messages for today.`,
            action: {
              label: "Upgrade",
              onClick: () => (window.location.href = "/price"),
            },
          });

          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        
          handleEndCall();
          return;
        }

        onUserFinal(userId, finalTranscriptRef.current);

        finalTranscriptRef.current = "";
        transcriptTimeoutRef.current = null;
      }
    }, 1500);
  };

  const [metaBallConfig, setMetaBallConfig] = useState({
    ballCount: 20,
    animationSize: 70,
    cursorBallSize: 2
  });

  useEffect(() => {
    const updateMetaBallConfig = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setMetaBallConfig({ ballCount: 12, animationSize: 40, cursorBallSize: 1.5 });
      } else if (width < 1024) {
        setMetaBallConfig({ ballCount: 16, animationSize: 55, cursorBallSize: 2 });
      } else if (width < 1440) {
        setMetaBallConfig({ ballCount: 20, animationSize: 70, cursorBallSize: 2 });
      } else {
        setMetaBallConfig({ ballCount: 25, animationSize: 85, cursorBallSize: 2.5 });
      }
    };

    updateMetaBallConfig();
    window.addEventListener('resize', updateMetaBallConfig);
    return () => window.removeEventListener('resize', updateMetaBallConfig);
  }, []);

  // Flush buffered audio when connection is established
  const flushAudioBuffer = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN && audioBufferRef.current.length > 0) {
      console.log(`Flushing ${audioBufferRef.current.length} buffered audio packets`);
      audioBufferRef.current.forEach(buffer => {
        if (!isMuted) {
          wsRef.current?.send(buffer);
        }
      });
      audioBufferRef.current = [];
    }
  };

  // Improved WebSocket connection with retry logic
  const connectWebSocket = (isReconnect: boolean = false) => {
    // Clear any existing connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Don't try to reconnect if we've exceeded max attempts
    if (isReconnect && reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setWsConnectionState('failed');
      toast.error("Connection Failed", {
        description: "Unable to connect to voice service. Please try again.",
      });
      handleEndCall();
      return;
    }

    setWsConnectionState(isReconnect ? 'reconnecting' : 'connecting');
    
    const wsUrl = userId
      ? `wss://api.euno.live/ws/audio?user_id=${encodeURIComponent(userId)}`
      : 'wss://api.euno.live/ws/audio';
    
    const ws = new WebSocket(wsUrl);

    // Set connection timeout (10 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket connection timeout');
        ws.close();
        
        // Retry connection
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 5000);
          console.log(`Retrying connection in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(true);
          }, delay);
        } else {
          setWsConnectionState('failed');
          toast.error("Connection Timeout", {
            description: "Could not connect to voice service. Please check your connection.",
          });
          handleEndCall();
        }
      }
    }, 10000);

    ws.onopen = () => {
      console.log("WebSocket connected successfully");
      setWsConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Flush any buffered audio
      flushAudioBuffer();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "transcription") {
        if (data.is_final) {
          handleDebouncedFinalTranscript(data.text);
        } else {
          setCurrentUserText(data.text);
        }
      }

      if (data.type === 'agent_response') {
        setCurrentUserText(data.text);
        if (data.is_final) {
          if (userId) onUserFinal(userId, data.text);
          setCurrentUserText("");
        }
      }

      if (data.type === 'agent_response') {
        if (typeof data.text === 'string' && data.text.trim().length > 0) {
          if (data.is_final) {
            onAgentFinal(userId || "", data.text);
            setCurrentAgentText("");
          } else {
            setCurrentAgentText(data.text);
          }
        }

        if (data.audio_data && (data.status === 'streaming' || data.status === 'complete')) {
          try {
            const mime = (data.audio_mime_type || '').toLowerCase();
            const u8 = base64ToUint8Array(data.audio_data);

            if (mime.includes('audio/wav')) {
              const arr = new Uint8Array(u8.byteLength);
              arr.set(u8);
              const blob = new Blob([arr.buffer], { type: 'audio/wav' });
              const url = URL.createObjectURL(blob);

              if (audioPlaybackRef.current) {
                try { audioPlaybackRef.current.pause(); } catch { }
                try { URL.revokeObjectURL(audioPlaybackRef.current.src); } catch { }
              }

              const audio = new Audio(url);
              audioPlaybackRef.current = audio;
              audio.volume = isMuted ? 0 : volume;
              setIsPlaying(true);

              audio.onended = () => {
                if (data.status === 'complete') setIsPlaying(false);
                try { URL.revokeObjectURL(url); } catch { }
              };
              audio.onerror = () => {
                console.error('Audio playback error for WAV');
                setIsPlaying(false);
                try { URL.revokeObjectURL(url); } catch { }
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

    ws.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      setWsConnectionState('disconnected');
      
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Auto-reconnect if call is still active and it wasn't a clean close
      if (isCallActive && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * reconnectAttemptsRef.current, 3000);
        console.log(`Attempting to reconnect in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(true);
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnectionState('failed');
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
          autoGainControl: true, // Added for better audio quality
        }
      });

      streamRef.current = stream;
      audioTracksRef.current = stream.getAudioTracks();

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
        if (!buffer) return;
        
        // If WebSocket is connected, send immediately
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          wsRef.current.send(buffer);
        } 
        // If connecting, buffer the audio
        else if (wsConnectionState === 'connecting' || wsConnectionState === 'reconnecting') {
          audioBufferRef.current.push(buffer);
          // Limit buffer size to prevent memory issues (keep last 5 seconds at 16kHz, 16-bit)
          const maxBufferSize = 50; // ~5 seconds of audio chunks
          if (audioBufferRef.current.length > maxBufferSize) {
            audioBufferRef.current.shift();
          }
        }
      };

      sourceNode.connect(workletNode);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Microphone Access Denied", {
        description: "Please allow microphone access to use voice chat.",
      });
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

    audioTracksRef.current = [];
    audioBufferRef.current = []; // Clear audio buffer
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    audioTracksRef.current.forEach(track => {
      track.enabled = !newMutedState;
    });

    console.log(newMutedState ? "Microphone muted" : "Microphone unmuted");
  };

  const handleStartCall = async () => {
    if (!isCallActive) {
      if (messageLimitInfo && !messageLimitInfo.canSendMessage) {
        toast.error("Daily Message Limit Reached", {
          description: `You've used all ${messageLimitInfo.limit} messages for today. Upgrade to Pro for unlimited messages!`,
          action: {
            label: "Upgrade",
            onClick: () => {
              window.location.href = "/price";
            }
          }
        });
        return;
      }

      setIsCallActive(true);
      setIsRecording(true);
      reconnectAttemptsRef.current = 0;

      // Start audio capture first (parallel operation)
      const audioCapturePromise = startAudioCapture();

      // Connect WebSocket and generate summary in parallel
      const wsPromise = new Promise<void>((resolve) => {
        connectWebSocket();
        resolve();
      });

      const summaryPromise = (async () => {
        if (userId && !summaryGeneratedRef.current) {
          try {
            await generateSummary({ userId });
            summaryGeneratedRef.current = true;
          } catch (error) {
            console.error("Error generating summary:", error);
          }
        }
      })();

      // Wait for all parallel operations
      await Promise.all([audioCapturePromise, wsPromise, summaryPromise]);

    } else {
      handleMuteToggle();
    }
  };

  const handleEndCall = () => {
    // Clear all timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsCallActive(false);
    setIsRecording(false);
    setIsPlaying(false);
    setIsMuted(false);
    setCurrentUserText("");
    setCurrentAgentText("");
    setWsConnectionState('disconnected');

    audioQueueRef.current = [];
    audioBufferRef.current = [];
    isPlayingRef.current = false;
    reconnectAttemptsRef.current = 0;

    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
      transcriptTimeoutRef.current = null;
    }

    finalTranscriptRef.current = "";
    summaryGeneratedRef.current = false;

    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { }
      audioCtxRef.current = null;
      playTimeRef.current = 0;
    }

    stopAudioCapture();
  };

  useEffect(() => {
    return () => {
      if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      handleEndCall();
    };
  }, []);

  useEffect(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        const buffer = event.data;
        if (!buffer) return;
        
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          wsRef.current.send(buffer);
        } else if (wsConnectionState === 'connecting' || wsConnectionState === 'reconnecting') {
          audioBufferRef.current.push(buffer);
          const maxBufferSize = 50;
          if (audioBufferRef.current.length > maxBufferSize) {
            audioBufferRef.current.shift();
          }
        }
      };
    }
  }, [isMuted, wsConnectionState]);

  useEffect(() => {
    if (userId) {
      checkUserMessageLimit();
    }
  }, [userId]);

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
    { icon: Smile, label: "Happy", color: "yellow" },
    { icon: Frown, label: "Sad", color: "blue" },
    { icon: HeartPulse, label: "Anxious", color: "purple" },
    { icon: AngryIcon, label: "Angry", color: "red" },
    { icon: Feather, label: "Calm", color: "green" },
    { icon: Sparkles, label: "Excited", color: "orange" }
  ];

  // Connection status indicator
  const getConnectionStatus = () => {
    switch (wsConnectionState) {
      case 'connecting':
        return { text: 'Connecting...', color: 'text-yellow-400' };
      case 'connected':
        return { text: 'Connected', color: 'text-emerald-400' };
      case 'reconnecting':
        return { text: 'Reconnecting...', color: 'text-orange-400' };
      case 'failed':
        return { text: 'Connection Failed', color: 'text-red-400' };
      default:
        return null;
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="flex flex-col h-[95vh] w-full items-center justify-center relative overflow-hidden bg-[#141413] transition-all">
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

      {/* Connection Status Indicator */}
      {connectionStatus && isCallActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            {(wsConnectionState === 'connecting' || wsConnectionState === 'reconnecting') && (
              <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
            )}
            {wsConnectionState === 'connected' && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            )}
            <span className={`text-sm ${connectionStatus.color}`}>
              {connectionStatus.text}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 sm:bottom-12 md:bottom-16 lg:bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
        <button
          onClick={handleStartCall}
          disabled={!!(messageLimitInfo && !messageLimitInfo.canSendMessage) || wsConnectionState === 'connecting'}
          className={`relative group ${(messageLimitInfo && !messageLimitInfo.canSendMessage) || wsConnectionState === 'connecting' ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isCallActive ? (isMuted ? 'Unmute' : 'Mute') : 'Start Chat'}
        >
          {isRecording && !isMuted && wsConnectionState === 'connected' && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ripple" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ripple" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ripple" style={{ animationDelay: '1s' }} />
            </>
          )}

          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            (messageLimitInfo && !messageLimitInfo.canSendMessage) || wsConnectionState === 'connecting'
              ? "bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/50 cursor-not-allowed"
              : isCallActive
                ? isMuted
                  ? "bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/50 hover:scale-105"
                  : "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/50 scale-110"
                : "bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-slate-900/50 hover:scale-105"
          }`}>
            {wsConnectionState === 'connecting' ? (
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white animate-spin" strokeWidth={2.5} />
            ) : isCallActive ? (
              isMuted ? (
                <MicOff className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" strokeWidth={2.5} />
              ) : (
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" strokeWidth={2.5} />
              )
            ) : (
              <Mic className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-slate-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
            )}
          </div>

          <div className="absolute -bottom-6 sm:-bottom-7 md:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs sm:text-sm text-slate-400 font-light">
              {messageLimitInfo && !messageLimitInfo.canSendMessage
                ? 'Limit Reached'
                : wsConnectionState === 'connecting'
                  ? 'Connecting...'
                  : isCallActive
                    ? (isMuted ? 'Unmute' : 'Mute')
                    : 'Start Chat'
              }
            </span>
          </div>
        </button>

        {isCallActive && (
          <button
            onClick={handleEndCall}
            className="relative group"
            aria-label="End Call"
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-2xl shadow-red-500/50 hover:shadow-red-600/50 hover:scale-105">
              <X className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white transition-colors" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-6 sm:-bottom-7 md:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs sm:text-sm text-slate-400 font-light">End Call</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};