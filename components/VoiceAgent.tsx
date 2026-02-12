"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Phone, PhoneOff, Download, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface VoiceAgentProps {
  onClose: () => void;
}

export default function VoiceAgent({ onClose }: VoiceAgentProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "listening" | "thinking" | "speaking">("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [pdfData, setPdfData] = useState<{ data: string; filename: string } | null>(null);
  const [duration, setDuration] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playbackBufferRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef(false);

  // Keep mute ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Convert Float32 PCM to Int16 PCM base64
  const float32ToBase64PCM16 = useCallback((float32: Float32Array): string => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i] as number));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }, []);

  // Convert base64 PCM16 to Float32 for playback
  const base64PCM16ToFloat32 = useCallback((base64: string): Float32Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i]! / 0x8000;
    }
    return float32;
  }, []);

  // Play queued audio buffers
  const playAudioBuffer = useCallback(async () => {
    if (isPlayingRef.current || playbackBufferRef.current.length === 0) return;
    isPlayingRef.current = true;
    setStatus("speaking");

    const ctx = audioContextRef.current;
    if (!ctx) {
      isPlayingRef.current = false;
      return;
    }

    while (playbackBufferRef.current.length > 0) {
      const samples = playbackBufferRef.current.shift()!;
      const buffer = ctx.createBuffer(1, samples.length, 24000);
      buffer.getChannelData(0).set(samples);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    isPlayingRef.current = false;
    setStatus("connected");
  }, []);

  // Cleanup resources — declared BEFORE startSession
  const cleanup = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    playbackBufferRef.current = [];
    isPlayingRef.current = false;
    setDuration(0);
  }, []);

  // Start microphone capture — declared BEFORE startSession
  const startMicCapture = useCallback(
    (audioCtx: AudioContext, stream: MediaStream) => {
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const base64 = float32ToBase64PCM16(input);
        socketRef.current?.emit("audio.append", { audio: base64 });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    },
    [float32ToBase64PCM16]
  );

  // Start voice session
  const startSession = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    setUserTranscript("");
    setAssistantTranscript("");
    setPdfData(null);

    const token = localStorage.getItem("maos_access_token");
    if (!token) {
      setError("Non authentifie");
      setStatus("idle");
      return;
    }

    let tenantId = "";
    let userId = "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      tenantId = payload.tenantId || "";
      userId = payload.sub || payload.userId || "";
    } catch {
      // fallback
    }

    try {
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const socket = io(`${API_URL}/realtime`, {
        auth: { token },
        transports: ["websocket"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("session.start", { token, tenantId, userId });
      });

      socket.on("session.ready", () => {
        setStatus("connected");
        startMicCapture(audioCtx, stream);
        durationTimerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);
      });

      socket.on("audio.delta", (data: { delta: string }) => {
        const samples = base64PCM16ToFloat32(data.delta);
        playbackBufferRef.current.push(samples);
        playAudioBuffer();
      });

      socket.on("audio.done", () => {});

      socket.on("transcript.delta", (data: { delta: string }) => {
        setAssistantTranscript((prev) => prev + data.delta);
        setStatus("speaking");
      });

      socket.on("transcript.done", (data: { transcript: string }) => {
        setAssistantTranscript(data.transcript);
      });

      socket.on("user.transcript", (data: { transcript: string }) => {
        setUserTranscript(data.transcript);
      });

      socket.on("vad.speech_started", () => {
        setStatus("listening");
        setAssistantTranscript("");
      });

      socket.on("vad.speech_stopped", () => {
        setStatus("thinking");
      });

      socket.on("function.calling", (data: { name: string }) => {
        setStatus("thinking");
        setAssistantTranscript(`Consultation des donnees (${data.name})...`);
      });

      socket.on("function.result", () => {});

      socket.on("response.started", () => {
        setStatus("thinking");
      });

      socket.on("response.done", () => {
        if (!isPlayingRef.current) {
          setStatus("connected");
        }
      });

      socket.on("pdf.ready", (data: { data: string; filename: string }) => {
        setPdfData({ data: data.data, filename: data.filename });
      });

      socket.on("error", (data: { message: string }) => {
        setError(data.message);
      });

      socket.on("session.closed", () => {
        setStatus("idle");
        cleanup();
      });

      socket.on("disconnect", () => {
        setStatus("idle");
        cleanup();
      });
    } catch (err: any) {
      setError(err.message || "Impossible d'acceder au microphone");
      setStatus("idle");
    }
  }, [base64PCM16ToFloat32, playAudioBuffer, startMicCapture, cleanup]);

  // Stop session
  const stopSession = useCallback(() => {
    socketRef.current?.emit("session.stop");
    cleanup();
    setStatus("idle");
    onClose();
  }, [onClose, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const newMuted = !m;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !newMuted;
        });
      }
      return newMuted;
    });
  }, []);

  // Download PDF
  const downloadPDF = useCallback(() => {
    if (!pdfData) return;
    const byteCharacters = atob(pdfData.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = pdfData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [pdfData]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const statusLabels: Record<string, string> = {
    idle: "Pret",
    connecting: "Connexion...",
    connected: "En ligne",
    listening: "Ecoute...",
    thinking: "Reflexion...",
    speaking: "MAOS parle...",
  };

  const statusColors: Record<string, string> = {
    idle: "text-muted-foreground",
    connecting: "text-yellow-500",
    connected: "text-success-400",
    listening: "text-blue-500",
    thinking: "text-yellow-500",
    speaking: "text-success-400",
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[60] flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success-400 animate-pulse" />
          <span className="text-sm font-medium">MAOS Voice</span>
          {status !== "idle" && (
            <span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopSession}
          className="text-muted-foreground hover:text-foreground"
        >
          Fermer
        </Button>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            status === "listening"
              ? "bg-blue-500/20 ring-4 ring-blue-500/30 scale-110"
              : status === "speaking"
              ? "bg-success-400/20 ring-4 ring-success-400/30 animate-pulse"
              : status === "thinking"
              ? "bg-yellow-500/20 ring-4 ring-yellow-500/30"
              : status === "connected"
              ? "bg-success-400/10 ring-2 ring-success-400/20"
              : "bg-muted ring-2 ring-muted-foreground/20"
          }`}
        >
          {status === "connecting" ? (
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
          ) : status === "speaking" ? (
            <Volume2 className="w-12 h-12 text-success-400 animate-pulse" />
          ) : (
            <Mic
              className={`w-12 h-12 ${
                status === "listening" ? "text-blue-500 animate-pulse" : "text-muted-foreground"
              }`}
            />
          )}
        </div>

        <div className="text-center">
          <p className={`text-lg font-medium ${statusColors[status]}`}>{statusLabels[status]}</p>
          {error && <p className="text-sm text-danger-400 mt-1">{error}</p>}
        </div>

        <div className="w-full max-w-md space-y-3 min-h-[120px]">
          {userTranscript && (
            <div className="bg-success-400/10 rounded-xl px-4 py-2 text-right">
              <p className="text-xs text-muted-foreground mb-1">Vous</p>
              <p className="text-sm">{userTranscript}</p>
            </div>
          )}
          {assistantTranscript && (
            <div className="bg-muted rounded-xl px-4 py-2">
              <p className="text-xs text-muted-foreground mb-1">MAOS</p>
              <p className="text-sm">{assistantTranscript}</p>
            </div>
          )}
        </div>

        {pdfData && (
          <Button onClick={downloadPDF} className="bg-success-400 hover:bg-success-500 text-white" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Telecharger le PDF
          </Button>
        )}
      </div>

      <div className="absolute bottom-12 flex items-center gap-4">
        {status === "idle" ? (
          <Button
            onClick={startSession}
            className="w-16 h-16 rounded-full bg-success-400 hover:bg-success-500 text-white"
            size="icon"
          >
            <Phone className="w-7 h-7" />
          </Button>
        ) : (
          <>
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "outline"}
              className="w-12 h-12 rounded-full"
              size="icon"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              onClick={stopSession}
              className="w-16 h-16 rounded-full bg-danger-400 hover:bg-red-600 text-white"
              size="icon"
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
