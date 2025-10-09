"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const ws = new WebSocket('ws://localhost:8000/ws/audio');

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transcription') {
        setCurrentUserText(data.text);

        // If transcription is final, add to messages
        if (data.is_final) {
          const userMessage: Message = {
            id: `user-${Date.now()}`,
            type: "user",
            text: data.text,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, userMessage]);
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
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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

      // Initialize AudioContext targeting 16 kHz; processor will resample if needed
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      // Load worklet from public folder
      await audioContext.audioWorklet.addModule('/pcm16-processor.js');

      // Create a source from the mic stream
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      // Create the PCM16 writer worklet
      const workletNode = new AudioWorkletNode(audioContext, 'pcm16-writer');
      workletNodeRef.current = workletNode;

      // When PCM16 buffers are available, send them over the websocket
      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        const buffer = event.data;
        if (buffer && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(buffer);
        }
      };

      // Connect source -> worklet (do not connect to destination to avoid echo)
      sourceNode.connect(workletNode);

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioCapture = () => {
    // Disconnect worklet and source
    try {
      if (sourceNodeRef.current && workletNodeRef.current) {
        sourceNodeRef.current.disconnect(workletNodeRef.current);
      }
    } catch { }
    workletNodeRef.current = null;
    sourceNodeRef.current = null;

    // Stop and close AudioContext
    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      try {
        ctx.close();
      } catch { }
    }

    // Stop mic tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      handleEndCall();
    };
  }, []);

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Reflect mute/volume changes to current playback
  useEffect(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Helper: base64 string -> Uint8Array
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-center">innpae</h1>
        <p className="text-center text-muted-foreground mt-1">
          Your safe space to talk and be heard
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${message.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-muted text-foreground"
                }`}
            >
              <p className="text-sm">{message.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {/* Current partial messages */}
        {currentUserText && (
          <div className="flex justify-end">
            <div className="max-w-[80%] p-3 rounded-lg bg-blue-400 text-white opacity-70">
              <p className="text-sm">{currentUserText}</p>
              <span className="text-xs opacity-70">Speaking...</span>
            </div>
          </div>
        )}

        {currentAgentText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-muted/70 text-foreground">
              <p className="text-sm">{currentAgentText}</p>
              <span className="text-xs opacity-70">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-background/50 backdrop-blur">
        <div className="flex items-center justify-center space-x-4">
          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleMute}
              disabled={!isCallActive}
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
              className="w-20"
              disabled={!isCallActive}
            />
          </div>

          {/* Main Call Button */}
          <Button
            onClick={isCallActive ? handleEndCall : handleStartCall}
            size="lg"
            variant={isCallActive ? "destructive" : "default"}
            className={`rounded-full w-16 h-16 ${isCallActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
              }`}
          >
            {isCallActive ? (
              <PhoneOff className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
          </Button>

          {/* Mic Indicator */}
          <div className="flex items-center space-x-2">
            <div
              className={`p-2 rounded-full ${isRecording ? "bg-red-100" : "bg-muted"}`}
            >
              {isRecording ? (
                <Mic className="h-4 w-4 text-red-500" />
              ) : (
                <MicOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {isRecording ? "Listening..." : "Not recording"}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mt-3">
          <span className="text-xs text-muted-foreground">
            {!isCallActive && "Ready to start"}
            {isCallActive && "Session active"}
            {isPlaying && " - Agent speaking"}
          </span>
        </div>
      </div>
    </div>
  );
};
