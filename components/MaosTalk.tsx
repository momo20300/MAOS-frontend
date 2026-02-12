"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, Mic, MicOff, Upload, X, FileText, Image, File, Volume2, VolumeX, Download, Minimize2, Maximize2, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessageToAI, sendMessageStreamingSSE, Message, fileToBase64, AIResponse, AttachedFile, StreamingCallbacks } from "@/lib/services/ai";

interface UploadedFile {
  file: File;
  preview?: string;
  content?: string;
  analyzing?: boolean;
}

export default function MaosTalk() {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(true); // Afficher l'historique
  const [isMinimized, setIsMinimized] = useState(false); // Chat minimisé (juste icône)
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pack, setPack] = useState<string>("PRO");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [useStreaming, setUseStreaming] = useState(true); // Enable streaming by default for faster responses
  const [streamingText, setStreamingText] = useState(""); // Current streaming text
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [sessionId] = useState(() => `maos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const audioQueueRef = useRef<{ audio: HTMLAudioElement; index: number }[]>([]);
  const currentAudioIndexRef = useRef(-1);
  const expectedAudioCountRef = useRef(0); // Track how many sentences we expect
  const streamingCompleteRef = useRef(false); // Track if streaming is done
  const isPlayingRef = useRef(false); // MUTEX: Prevent multiple simultaneous playbacks
  const audioUnlockedRef = useRef(false); // Track if browser audio has been unlocked
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset activity timer (user interacting)
  const resetActivityTimer = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  // Auto-hide after 10 seconds of inactivity
  useEffect(() => {
    // Don't auto-hide if minimized, loading, recording, or speaking
    if (isMinimized || isLoading || isRecording || isSpeaking || isTranscribing) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Set timer to hide after 10 seconds
    inactivityTimerRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity >= 10000) {
        setIsMinimized(true);
      }
    }, 10000);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [lastActivityTime, isMinimized, isLoading, isRecording, isSpeaking, isTranscribing]);

  // Reset activity when typing
  useEffect(() => {
    if (message) {
      resetActivityTimer();
    }
  }, [message, resetActivityTimer]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 144) + "px";
    }
  }, [message]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      role: "assistant",
      content: "Bonjour. Je suis MAOS, votre assistant numérique. Comment puis-je vous aider ?",
      lang: "fr",
      langName: "Français",
      direction: "ltr",
    };
    setMessages([welcomeMessage]);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // ===== TEXT-TO-SPEECH (TTS) =====
  // Use browser's Web Speech API for Arabic (FREE), API for other languages
  const speakWithBrowserTTS = (text: string, lang: string = 'ar-MA') => {
    if (!ttsEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const processedText = text.replace(/\bMAD\b/gi, 'dirhams');
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v =>
      v.lang.startsWith('ar') || v.lang.includes('Arab')
    );
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setTimeout(() => {
      window.speechSynthesis.cancel();
    }, 150);

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 250);
  };

  const speakText = async (text: string, langCode?: string) => {
    if (!ttsEnabled) return;

    const processedText = text.replace(/\bMAD\b/gi, 'dirhams');

    try {
      setIsSpeaking(true);

      const ttsText = processedText.substring(0, 4000);

      const response = await fetch(`${API_URL}/api/speech/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: ttsText,
          lang: langCode,
        }),
      });

      if (!response.ok) {
        speakWithBrowserTTS(text, 'fr');
        return;
      }

      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        setIsSpeaking(false);
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      try {
        await audio.play();
      } catch (playError: any) {
        if (playError.name === 'NotAllowedError') {
          // Browser blocks autoplay — user needs to interact first
        }
        throw playError;
      }
    } catch {
      speakWithBrowserTTS(text, 'fr');
    }
  };

  const stopSpeaking = useCallback(() => {
    // Stop API-based audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ''; // Force stop any loading
      audioRef.current = null;
    }
    // Stop browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // ===== FILE UPLOAD & PARSING =====
  const parseExcelFile = async (file: File): Promise<string> => {
    const ExcelJS = await import('exceljs');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const formatCellValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toLocaleDateString('fr-FR');
      if (typeof value === 'object' && value.result !== undefined) return String(value.result);
      return String(value);
    };

    let content = '';
    workbook.eachSheet((sheet) => {
      content += `=== Feuille: ${sheet.name} ===\n`;
      let rowCount = 0;
      sheet.eachRow((row, rowNumber) => {
        if (rowCount >= 100) return;
        const values = row.values as any[];
        const formattedRow = values.slice(1).map(formatCellValue);
        content += formattedRow.join(' | ') + '\n';
        rowCount++;
      });
      content += '\n';
    });

    return content;
  };

  const parseTextFile = async (file: File): Promise<string> => {
    return await file.text();
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const newFile: UploadedFile = { file, analyzing: true };

      if (file.type.startsWith('image/')) {
        newFile.preview = URL.createObjectURL(file);
      }

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        let content = '';
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'xlsx' || ext === 'xls') {
          content = await parseExcelFile(file);
        } else if (ext === 'csv' || ext === 'txt') {
          content = await parseTextFile(file);
        } else if (ext === 'pdf') {
          content = `[Fichier PDF: ${file.name}] - Extraction du contenu en cours...`;
        } else if (file.type.startsWith('image/')) {
          content = `[Image: ${file.name}] - Image uploadée pour analyse visuelle`;
        } else {
          content = `[Fichier: ${file.name}] - Type: ${file.type || 'inconnu'}`;
        }

        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === file ? { ...f, content, analyzing: false } : f
          )
        );
      } catch {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === file ? { ...f, content: `Erreur de lecture: ${file.name}`, analyzing: false } : f
          )
        );
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeFile = useCallback((file: File) => {
    setUploadedFiles(prev => {
      const filtered = prev.filter(f => f.file !== file);
      const removed = prev.find(f => f.file === file);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  }, []);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // ===== PDF DOWNLOAD =====
  const downloadPDF = (pdfData: string, filename: string) => {
    try {
      if (!pdfData || pdfData.length === 0) return;

      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // PDF download failed
    }
  };

  // ===== SPEECH-TO-TEXT (MICRO) =====
  const startRecording = useCallback(async () => {
    try {
      // Stop TTS when starting to record (avoid feedback)
      if (isSpeaking) {
        stopSpeaking();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      // Try WebM first, fall back to other formats
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm'
        });
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      resetActivityTimer();

    } catch {
      // Microphone access denied
    }
  }, [isSpeaking, stopSpeaking, resetActivityTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/templao/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      if (data.text && data.text.trim()) {
        // Auto-send: Set message and trigger send automatically
        const transcribedText = data.text.trim();
        setMessage(transcribedText);

        // Use setTimeout to ensure state is updated before sending
        setTimeout(() => {
          handleSendWithText(transcribedText);
        }, 100);
      }
    } catch {
      // Transcription failed
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ===== SEND MESSAGE =====
  // Version that accepts text directly (for auto-send after voice)
  // NOW INCLUDES FILE SUPPORT
  const handleSendWithText = async (textToSend: string) => {
    if ((!textToSend.trim() && uploadedFiles.length === 0) || isLoading) return;

    // Use streaming for simple text queries (no files) - faster response
    if (useStreaming && uploadedFiles.length === 0 && textToSend.trim()) {
      return handleSendStreaming(textToSend);
    }

    let userContent = textToSend.trim();
    const imagesToSend: string[] = [];
    const filesToSend: Array<{ name: string; type: string; content: string }> = [];

    // Process uploaded files (same logic as handleSend)
    if (uploadedFiles.length > 0) {
      for (const f of uploadedFiles) {
        if (f.file.type.startsWith('image/')) {
          try {
            const base64 = await fileToBase64(f.file);
            imagesToSend.push(base64);
          } catch {
            // Image conversion failed
          }
        } else if (f.content && f.content.length > 0) {
          filesToSend.push({
            name: f.file.name,
            type: f.file.type || 'text/plain',
            content: f.content.substring(0, 50000),
          });
        }
      }

      if (!userContent && filesToSend.length > 0) {
        userContent = "Analyse ce fichier";
      }
    }

    // Build attached files for message display
    const attachedFilesForMessage: AttachedFile[] = filesToSend.map(f => ({
      name: f.name,
      type: f.type,
      size: f.content.length,
      content: f.content,
    }));

    setMessage("");
    setUploadedFiles([]);

    // Create user message WITH files attached
    const userMessage: Message = {
      role: "user" as const,
      content: userContent || "Analyse ce fichier",
      files: attachedFilesForMessage.length > 0 ? attachedFilesForMessage : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAI(newMessages, {
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
        files: filesToSend.length > 0 ? filesToSend : undefined,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse.message,
        pdf: aiResponse.pdf,
        lang: aiResponse.lang,
        langName: aiResponse.langName,
        direction: aiResponse.direction,
      };

      setMessages([...newMessages, assistantMessage]);

      if (ttsEnabled && aiResponse.message && aiResponse.hasTTS) {
        speakText(aiResponse.message, aiResponse.lang);
      }
    } catch {
      setMessages([...newMessages, {
        role: "assistant" as const,
        content: "Une erreur technique est survenue. Veuillez réessayer."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock browser audio playback on first user gesture
  // Browsers block audio.play() unless triggered by a user interaction
  const unlockBrowserAudio = () => {
    if (audioUnlockedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        audioUnlockedRef.current = true;
      }
    } catch { /* ignore */ }
  };

  // ===== STREAMING SEND =====
  // Sends message with real-time streaming for faster perceived response
  const handleSendStreaming = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Unlock audio on first user gesture (fixes first-message TTS)
    unlockBrowserAudio();

    setMessage("");
    setStreamingText("");
    audioQueueRef.current = [];
    currentAudioIndexRef.current = -1;
    expectedAudioCountRef.current = 0;
    streamingCompleteRef.current = false;
    isPlayingRef.current = false;

    const userMessage: Message = {
      role: "user" as const,
      content: textToSend.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Add placeholder for streaming response
    const streamingMessage: Message = {
      role: "assistant",
      content: "",
      lang: "fr",
      direction: "ltr",
    };
    setMessages([...newMessages, streamingMessage]);

    const callbacks: StreamingCallbacks = {
      onTextChunk: (chunk: string) => {
        setStreamingText(prev => prev + chunk);
        // Update the last message with new text
        setMessages(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          const lastMsg = updated[lastIndex];
          if (lastMsg && lastMsg.role === "assistant") {
            updated[lastIndex] = {
              ...lastMsg,
              content: (lastMsg.content || "") + chunk,
            };
          }
          return updated;
        });
      },

      onSentenceComplete: (sentence: string, index: number) => {
        // Track expected audio count
        expectedAudioCountRef.current = Math.max(expectedAudioCountRef.current, index + 1);
      },

      onAudioReady: (audioBase64: string, index: number) => {
        if (!ttsEnabled || !audioBase64 || audioBase64.length === 0) return;

        // Create audio element and add to queue
        const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
        const audio = new Audio(audioUrl);
        audioQueueRef.current.push({ audio, index });

        // Start playing if this is the first or next in sequence
        if (currentAudioIndexRef.current === -1 || index === currentAudioIndexRef.current + 1) {
          playNextAudio();
        }
      },

      onPdfReady: (pdfData: string, filename: string, _reportTitle: string) => {
        setMessages(msgs => {
          const updated = [...msgs];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, pdf: { data: pdfData, filename } };
          }
          return updated;
        });
      },

      onComplete: (fullText: string, processingTime: number, audioCount?: number) => {
        streamingCompleteRef.current = true;
        setIsLoading(false);
        setStreamingText("");

        // Final update to ensure message is complete
        setMessages(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          const lastMsg = updated[lastIndex];
          if (lastMsg && lastMsg.role === "assistant") {
            updated[lastIndex] = {
              ...lastMsg,
              content: fullText,
            };
          }
          return updated;
        });

        // If audio is stuck waiting for a missing segment, skip to next available
        setTimeout(() => {
          if (audioQueueRef.current.length > 0 && !isPlayingRef.current) {
            playNextAudio();
          }
        }, 300);
      },

      onError: () => {
        setIsLoading(false);
        setMessages(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          const lastMsg = updated[lastIndex];
          if (lastMsg && lastMsg.role === "assistant") {
            updated[lastIndex] = {
              ...lastMsg,
              content: "Une erreur est survenue. Veuillez réessayer.",
            };
          }
          return updated;
        });
      },
    };

    try {
      await sendMessageStreamingSSE(textToSend.trim(), callbacks, { wantAudio: ttsEnabled, sessionId });
    } catch {
      setIsLoading(false);
    }
  };

  // Play audio from queue in sequence (with mutex to prevent overlapping)
  const playNextAudio = () => {
    // MUTEX: Prevent multiple simultaneous playbacks
    if (isPlayingRef.current) return;

    let nextIndex = currentAudioIndexRef.current + 1;
    let nextAudio = audioQueueRef.current.find(a => a.index === nextIndex);

    // If streaming is complete and the next audio is missing, skip to the next available
    if (!nextAudio && streamingCompleteRef.current) {
      const availableIndices = audioQueueRef.current
        .map(a => a.index)
        .filter(i => i > currentAudioIndexRef.current)
        .sort((a, b) => a - b);

      const firstAvailable = availableIndices[0];
      if (firstAvailable !== undefined) {
        nextIndex = firstAvailable;
        nextAudio = audioQueueRef.current.find(a => a.index === nextIndex);
      }
    }

    if (nextAudio) {
      isPlayingRef.current = true;
      currentAudioIndexRef.current = nextIndex;
      setIsSpeaking(true);

      nextAudio.audio.onended = () => {
        isPlayingRef.current = false;
        const hasMore = audioQueueRef.current.some(a => a.index > nextIndex);
        if (hasMore) {
          playNextAudio();
        } else if (streamingCompleteRef.current) {
          setIsSpeaking(false);
        }
      };

      nextAudio.audio.onerror = () => {
        isPlayingRef.current = false;
        playNextAudio();
      };

      nextAudio.audio.play().catch(() => {
        isPlayingRef.current = false;
        playNextAudio();
      });
    } else if (streamingCompleteRef.current) {
      setIsSpeaking(false);
    }
  };

  const handleSend = async () => {
    // Unlock audio on user gesture
    unlockBrowserAudio();
    // Check if any file is still being analyzed
    const filesStillAnalyzing = uploadedFiles.some(f => f.analyzing);
    if (filesStillAnalyzing) return;

    if ((!message.trim() && uploadedFiles.length === 0) || isLoading) return;

    // Use streaming for simple text queries (no files) - faster response
    if (useStreaming && uploadedFiles.length === 0 && message.trim()) {
      return handleSendStreaming(message.trim());
    }

    let userContent = message.trim();
    const imagesToSend: string[] = [];
    const filesToSend: Array<{ name: string; type: string; content: string }> = [];

    // Process files - extract images and content
    if (uploadedFiles.length > 0) {
      const fileNames: string[] = [];

      for (const f of uploadedFiles) {
        // If it's an image, convert to base64 for vision
        if (f.file.type.startsWith('image/')) {
          try {
            const base64 = await fileToBase64(f.file);
            imagesToSend.push(base64);
            fileNames.push(`📷 ${f.file.name}`);
          } catch {
            // Image conversion failed
          }
        } else if (f.content && f.content.length > 0) {
          filesToSend.push({
            name: f.file.name,
            type: f.file.type || 'text/plain',
            content: f.content.substring(0, 50000), // Limit to 50KB
          });
          fileNames.push(`📎 ${f.file.name}`);
        } else {
          fileNames.push(`📎 ${f.file.name} (non lu)`);
        }
      }

      // If there are files but no message, create a default message
      if (fileNames.length > 0 && !userContent) {
        userContent = "Analyse ce fichier";
      }
    }

    // Build attached files for message display
    const attachedFilesForMessage: AttachedFile[] = filesToSend.map(f => ({
      name: f.name,
      type: f.type,
      size: f.content.length,
      content: f.content,
    }));

    setMessage("");
    setUploadedFiles([]);

    // Create user message WITH files attached for display in bubble
    const userMessage: Message = {
      role: "user" as const,
      content: userContent || "Analyse ce fichier",
      files: attachedFilesForMessage.length > 0 ? attachedFilesForMessage : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAI(newMessages, {
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
        files: filesToSend.length > 0 ? filesToSend : undefined,
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse.message,
        pdf: aiResponse.pdf, // Include PDF if present
        lang: aiResponse.lang,
        langName: aiResponse.langName,
        direction: aiResponse.direction,
      };

      // Debug: Log PDF attachment
      setMessages([...newMessages, assistantMessage]);

      if (ttsEnabled && aiResponse.message && aiResponse.hasTTS) {
        speakText(aiResponse.message, aiResponse.lang);
      }
    } catch {
      setMessages([...newMessages, {
        role: "assistant" as const,
        content: "Une erreur technique est survenue. Veuillez réessayer."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.xls,.xlsx,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* MODE MINIMISÉ - Juste un bouton flottant */}
      {isMinimized && (
        <button
          onClick={() => { setIsMinimized(false); resetActivityTimer(); }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-success-400 to-success-300 flex items-center justify-center shadow-2xl z-50 hover:scale-110 transition-transform"
          title="Ouvrir MAOS Chat"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          {messages.length > 1 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-400 rounded-full text-white text-xs flex items-center justify-center">
              {messages.length - 1}
            </span>
          )}
        </button>
      )}

      {/* MODE NORMAL - Chat complet */}
      {!isMinimized && (
        <>
          {/* Historique messages */}
          {isExpanded && messages.length > 0 && (
            <div className="fixed bottom-32 left-0 md:left-64 right-0 mx-auto max-w-4xl bg-background/95 backdrop-blur-sm border rounded-t-xl p-4 max-h-96 overflow-y-auto shadow-2xl z-50">
              {/* Titre de l'historique */}
              <div className="flex justify-between items-center mb-3 pb-2 border-b">
                <span className="text-xs text-muted-foreground">Conversation MAOS</span>
                <span className="text-xs text-muted-foreground">{messages.length} messages</span>
              </div>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-success-400 to-success-300 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user"
                        ? "bg-success-400 text-white"
                        : "bg-muted"
                        }`}
                      dir={msg.direction || 'ltr'}
                    >
                      {/* Fichiers attachés - affichés DANS la bulle */}
                      {msg.files && msg.files.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {msg.files.map((file, fileIdx) => (
                            <div
                              key={fileIdx}
                              className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${msg.role === "user"
                                ? "bg-success-500/50"
                                : "bg-muted-foreground/10"
                                }`}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="font-medium">{file.name}</span>
                              <span className="opacity-70">({Math.round(file.size / 1024)} KB)</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className={`text-sm whitespace-pre-wrap ${msg.direction === 'rtl' ? 'text-right' : ''}`}>{msg.content}</p>
                      {/* PDF Download Button */}
                      {msg.pdf && msg.pdf.data && (
                        <Button
                          onClick={() => downloadPDF(msg.pdf!.data, msg.pdf!.filename)}
                          className="mt-3 bg-success-400 hover:bg-success-500 text-white"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger le PDF
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-success-400 to-success-300 flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <p className="text-sm text-muted-foreground">MAOS réfléchit...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Barre de chat */}
          <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-background/95 backdrop-blur-sm border-t shadow-2xl z-50">
            <div className="max-w-4xl mx-auto p-4">
              {/* Fichiers uploadés */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${f.analyzing
                        ? 'bg-yellow-100 border border-yellow-300 dark:bg-yellow-900/30'
                        : f.content
                          ? 'bg-success-50 border border-success-200 dark:bg-green-900/30'
                          : 'bg-muted'
                        }`}
                    >
                      {f.analyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                      ) : f.preview ? (
                        <img src={f.preview} alt="" className="w-8 h-8 object-cover rounded" />
                      ) : (
                        getFileIcon(f.file.type)
                      )}
                      <span className="max-w-32 truncate">{f.file.name}</span>
                      {f.analyzing && <span className="text-yellow-600 text-xs">Analyse...</span>}
                      {f.content && !f.analyzing && (
                        <span className="text-success-400 text-xs font-medium">✓ Prêt ({Math.round(f.content.length / 1024)}KB)</span>
                      )}
                      <button
                        onClick={() => removeFile(f.file)}
                        className="text-muted-foreground hover:text-danger-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-shrink-0 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-success-400 to-success-300 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : isSpeaking ? (
                      <Volume2 className="w-5 h-5 text-white animate-pulse" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>

                {/* Bouton TTS On/Off - Si MAOS parle, clic = stop audio. Sinon, toggle TTS */}
                <Button
                  size="icon"
                  variant={isSpeaking ? "destructive" : ttsEnabled ? "default" : "outline"}
                  onClick={() => {
                    resetActivityTimer();
                    if (isSpeaking) {
                      // Si MAOS parle, on arrête juste l'audio (sans changer le setting TTS)
                      stopSpeaking();
                    } else {
                      // Si pas en train de parler, on toggle le setting TTS
                      setTtsEnabled(!ttsEnabled);
                    }
                  }}
                  className={`h-10 w-10 rounded-lg flex-shrink-0 mb-2 ${isSpeaking ? 'animate-pulse' : ttsEnabled ? 'bg-success-400 hover:bg-success-500' : ''
                    }`}
                  title={isSpeaking ? "Arrêter MAOS" : ttsEnabled ? "Désactiver la voix" : "Activer la voix"}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className={`h-5 w-5 ${ttsEnabled ? 'text-white' : 'text-success-400'}`} />
                  )}
                </Button>

                {/* Bouton Upload */}
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="h-10 w-10 rounded-lg flex-shrink-0 mb-2 hover:bg-success-50 hover:border-success-400"
                  title="Joindre un fichier"
                >
                  <Upload className="h-5 w-5 text-success-400" />
                </Button>

                {/* Bouton Micro */}
                <Button
                  size="icon"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={toggleRecording}
                  disabled={isLoading || isTranscribing}
                  className={`h-10 w-10 rounded-lg flex-shrink-0 mb-2 ${isRecording
                    ? "animate-pulse"
                    : "hover:bg-success-50 hover:border-success-400"
                    }`}
                  title={isRecording ? "Arrêter l'enregistrement" : "Parler à MAOS"}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5 text-success-400" />
                  )}
                </Button>

                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { setIsExpanded(true); resetActivityTimer(); }}
                    placeholder={isRecording ? "🎤 Enregistrement en cours..." : "Parle à MAOS..."}
                    disabled={isLoading || isRecording}
                    className="w-full resize-none rounded-xl border bg-background px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-success-400 transition-all overflow-hidden scrollbar-hide disabled:opacity-50"
                    rows={1}
                    style={{
                      minHeight: "48px",
                      maxHeight: "144px"
                    }}
                  />

                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={(!message.trim() && uploadedFiles.length === 0) || isLoading || uploadedFiles.some(f => f.analyzing)}
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-success-400 hover:bg-success-500 disabled:opacity-50 transition-all"
                    title={uploadedFiles.some(f => f.analyzing) ? "Analyse du fichier en cours..." : "Envoyer"}
                  >
                    {uploadedFiles.some(f => f.analyzing) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    MAOS AI {pack}
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">
                    {ttsEnabled ? '🔊 Voix' : '🔇 Muet'}
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <button
                    onClick={() => setUseStreaming(!useStreaming)}
                    className={`text-xs flex items-center gap-1 ${useStreaming ? 'text-success-400 font-medium' : 'text-muted-foreground'}`}
                    title={useStreaming ? 'Mode streaming activé (réponses rapides)' : 'Activer le streaming'}
                  >
                    <Zap className={`w-3 h-3 ${useStreaming ? 'fill-current' : ''}`} />
                    {useStreaming ? 'Stream' : 'Standard'}
                  </button>
                  <span className="text-xs text-muted-foreground">•</span>
                  {/* Boutons Réduire et Masquer - toujours visibles */}
                  {isExpanded ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsExpanded(false); resetActivityTimer(); }}
                      className="h-5 px-2 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Minimize2 className="w-3 h-3 mr-1" />
                      Réduire
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsExpanded(true); resetActivityTimer(); }}
                      className="h-5 px-2 text-xs text-success-400"
                    >
                      <Maximize2 className="w-3 h-3 mr-1" />
                      Historique
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(true)}
                    className="h-5 px-2 text-xs text-orange-600 hover:text-orange-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Masquer
                  </Button>
                </div>
                <p className="text-xs text-success-400 font-medium">
                  {isRecording ? "🔴 Enregistrement..." : isTranscribing ? "🎤 Transcription..." : isSpeaking ? "🗣️ MAOS parle..." : "💚 En ligne"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
