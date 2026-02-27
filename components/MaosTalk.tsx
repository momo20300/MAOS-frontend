"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Sparkles, Loader2, Phone, X, FileText, Image, File, Download, Volume2, VolumeX, Copy, Check, Paperclip, MessageSquare, Pin, PinOff } from "lucide-react";
import { sendMessageToAI, sendMessageStreamingSSE, Message, fileToBase64, AttachedFile, StreamingCallbacks } from "@/lib/services/ai";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const VoiceAgent = dynamic(() => import("./VoiceAgent"), { ssr: false });

// Code block with copy button
const CodeBlock = memo(function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || '';
  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative group my-3">
      {lang && <span className="absolute top-2 left-3 text-[10px] text-gray-500 uppercase">{lang}</span>}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copier"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      <pre className="bg-black/30 rounded-lg p-4 pt-7 overflow-x-auto text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
});

// Memoized message component — modern Claude-like design
const ChatBubble = memo(function ChatBubble({ msg, onDownloadPDF, onSpeak, isSpeaking }: {
  msg: Message;
  onDownloadPDF: (data: string, filename: string) => void;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%]">
          {msg.files && msg.files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5 justify-end">
              {msg.files.map((file, fileIdx) => (
                <span key={fileIdx} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/[0.06] text-gray-400">
                  <Paperclip className="w-3 h-3" />
                  {file.name}
                </span>
              ))}
            </div>
          )}
          <div className="bg-white/[0.06] rounded-2xl px-4 py-3" dir={msg.direction || 'ltr'}>
            <p className="text-[15px] leading-relaxed text-gray-200">{msg.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message — no bubble, clean text with markdown
  return (
    <div className="mb-6" dir={msg.direction || 'ltr'}>
      <div className="max-w-3xl">
        <div className="text-[15px] leading-[1.7] text-gray-200 prose prose-invert prose-sm max-w-none
          prose-p:my-2 prose-headings:text-gray-100 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
          prose-strong:text-gray-100 prose-code:text-emerald-400 prose-code:bg-black/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-table:border-white/[0.08] prose-th:border-white/[0.08] prose-td:border-white/[0.08] prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5
          prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const isBlock = className || (typeof children === 'string' && children.includes('\n'));
                if (isBlock) {
                  return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
                }
                return <code className={className} {...props}>{children}</code>;
              },
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>

        {msg.pdf && msg.pdf.data && (
          <button
            onClick={() => onDownloadPDF(msg.pdf!.data, msg.pdf!.filename)}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Télécharger le PDF
          </button>
        )}

        {msg.content && onSpeak && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => onSpeak(msg.content)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              title={isSpeaking ? "Arrêter la lecture" : "Lire à voix haute"}
            >
              {isSpeaking ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500 hover:text-gray-300" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

interface UploadedFile {
  file: File;
  preview?: string;
  content?: string;
  analyzing?: boolean;
}

export default function MaosTalk() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [useStreaming] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [speakingMsgContent, setSpeakingMsgContent] = useState<string | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [sessionId] = useState(() => `maos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileDialogOpenRef = useRef(false);

  // TTS audio playback queue (max 50 chunks to prevent memory leak)
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Streaming optimization: buffer chunks and flush every 50ms instead of per-chunk
  const streamBufferRef = useRef("");
  const streamFlushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    const audioData = audioQueueRef.current.shift();
    if (!audioData) return;
    isPlayingRef.current = true;
    const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
    currentAudioRef.current = audio;
    const releaseAudio = () => {
      audio.src = '';
      audio.load(); // Release data URL memory
    };
    audio.onended = () => {
      releaseAudio();
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      playNextAudio();
    };
    audio.onerror = () => {
      releaseAudio();
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      playNextAudio();
    };
    audio.play().catch(() => {
      releaseAudio();
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      playNextAudio();
    });
  }, []);

  const stopAudio = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current.load(); // Release data URL memory
      currentAudioRef.current = null;
    }
  }, []);

  // TTS speak toggle for individual messages
  const speakMessage = useCallback(async (text: string) => {
    // If already speaking this message, stop
    if (speakingMsgContent === text) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = '';
        ttsAudioRef.current = null;
      }
      setSpeakingMsgContent(null);
      return;
    }
    // Stop any previous TTS
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.src = '';
      ttsAudioRef.current = null;
    }
    setSpeakingMsgContent(text);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/speech/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: "fr" }),
      });
      if (!res.ok) { setSpeakingMsgContent(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        ttsAudioRef.current = null;
        setSpeakingMsgContent(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        ttsAudioRef.current = null;
        setSpeakingMsgContent(null);
      };
      await audio.play();
    } catch {
      setSpeakingMsgContent(null);
    }
  }, [speakingMsgContent]);

  // Flush buffered streaming text to state (called every 50ms during streaming)
  const flushStreamBuffer = useCallback(() => {
    const buffered = streamBufferRef.current;
    if (!buffered) return;
    streamBufferRef.current = "";
    setMessages(msgs => {
      const updated = [...msgs];
      const lastIndex = updated.length - 1;
      const lastMsg = updated[lastIndex];
      if (lastMsg && lastMsg.role === "assistant") {
        updated[lastIndex] = {
          ...lastMsg,
          content: (lastMsg.content || "") + buffered,
        };
      }
      return updated;
    });
  }, []);

  // Auto-collapse: 15s of no interaction → collapse chat panel
  const resetCollapseTimer = useCallback(() => {
    if (isPinned) return; // Pinned → never auto-collapse
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => {
      if (isPinned) return;
      if (fileDialogOpenRef.current) return; // File dialog open
      const hasText = textareaRef.current ? textareaRef.current.value.length > 0 : false;
      const hasFocus = document.activeElement === textareaRef.current;
      if (!hasText && !hasFocus) {
        setIsCollapsed(true);
      }
    }, 15000);
  }, [isPinned]);

  // Pause collapse timer while MAOS is streaming
  useEffect(() => {
    if (isLoading) {
      if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null; }
    } else if (!isCollapsed) {
      resetCollapseTimer();
    }
  }, [isLoading, isCollapsed, resetCollapseTimer]);

  // Start collapse timer when panel opens, scroll to bottom
  useEffect(() => {
    if (!isCollapsed) {
      resetCollapseTimer();
      // Scroll to bottom so user sees latest messages after re-open
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    }
    return () => { if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current); };
  }, [isCollapsed, resetCollapseTimer]);

  // Clear collapse timer when pinned
  useEffect(() => {
    if (isPinned && collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, [isPinned]);

  // Track file dialog open/close to pause collapse timer
  useEffect(() => {
    const onWindowFocus = () => {
      if (fileDialogOpenRef.current) {
        fileDialogOpenRef.current = false;
        if (!isPinned && !isCollapsed) resetCollapseTimer();
      }
    };
    window.addEventListener('focus', onWindowFocus);
    return () => window.removeEventListener('focus', onWindowFocus);
  }, [isPinned, isCollapsed, resetCollapseTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamFlushTimerRef.current) clearTimeout(streamFlushTimerRef.current);
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 144) + "px";
    }
  }, [message]);

  // Throttled scroll — scroll at most every 200ms during streaming to avoid jank
  const lastScrollRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastScrollRef.current < 200) return;
    lastScrollRef.current = now;
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

  // ===== STREAMING SEND =====
  const handleSendStreaming = async (textToSend: string, filesToSend?: Array<{ name: string; type: string; content: string }>, attachedFiles?: AttachedFile[]) => {
    if (!textToSend.trim() || isLoading) return;

    stopAudio(); // Stop any playing audio from previous response
    setMessage("");

    const userMessage: Message = {
      role: "user" as const,
      content: textToSend.trim(),
      files: attachedFiles,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const streamingMessage: Message = {
      role: "assistant",
      content: "",
      lang: "fr",
      direction: "ltr",
    };
    setMessages([...newMessages, streamingMessage]);

    const callbacks: StreamingCallbacks = {
      onTextChunk: (chunk: string) => {
        // Buffer chunks and flush every 50ms to avoid 500+ re-renders
        streamBufferRef.current += chunk;
        if (!streamFlushTimerRef.current) {
          streamFlushTimerRef.current = setTimeout(() => {
            streamFlushTimerRef.current = null;
            flushStreamBuffer();
          }, 50);
        }
      },

      onAudioReady: (audioBase64: string) => {
        // Cap audio queue at 50 items to prevent memory leak
        if (audioQueueRef.current.length < 50) {
          audioQueueRef.current.push(audioBase64);
        }
        playNextAudio();
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

      onComplete: (fullText: string) => {
        // Clear any pending flush timer
        if (streamFlushTimerRef.current) {
          clearTimeout(streamFlushTimerRef.current);
          streamFlushTimerRef.current = null;
        }
        streamBufferRef.current = "";
        setIsLoading(false);

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
      },

      onError: () => {
        // Clear streaming buffer on error
        if (streamFlushTimerRef.current) {
          clearTimeout(streamFlushTimerRef.current);
          streamFlushTimerRef.current = null;
        }
        streamBufferRef.current = "";
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
      await sendMessageStreamingSSE(textToSend.trim(), callbacks, { wantAudio: false, sessionId, files: filesToSend });
    } catch {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const filesStillAnalyzing = uploadedFiles.some(f => f.analyzing);
    if (filesStillAnalyzing) return;

    if ((!message.trim() && uploadedFiles.length === 0) || isLoading) return;

    if (useStreaming && uploadedFiles.length === 0 && message.trim()) {
      return handleSendStreaming(message.trim());
    }

    // Use streaming even with files (files sent as text content)
    if (useStreaming && uploadedFiles.length > 0) {
      const nonImageFiles = uploadedFiles.filter(f => !f.file.type.startsWith('image/'));
      const hasOnlyParsedFiles = nonImageFiles.length > 0 && nonImageFiles.every(f => f.content && !f.analyzing);

      if (hasOnlyParsedFiles) {
        const streamFiles = nonImageFiles.map(f => ({
          name: f.file.name,
          type: f.file.type || 'text/plain',
          content: f.content!.substring(0, 50000),
        }));
        const attached: AttachedFile[] = streamFiles.map(f => ({
          name: f.name, type: f.type, size: f.content.length, content: f.content,
        }));
        const text = message.trim() || "Analyse ce fichier";
        setMessage("");
        setUploadedFiles([]);
        return handleSendStreaming(text, streamFiles, attached);
      }
    }

    let userContent = message.trim();
    const imagesToSend: string[] = [];
    const filesToSend: Array<{ name: string; type: string; content: string }> = [];

    if (uploadedFiles.length > 0) {
      const fileNames: string[] = [];

      for (const f of uploadedFiles) {
        if (f.file.type.startsWith('image/')) {
          try {
            const base64 = await fileToBase64(f.file);
            imagesToSend.push(base64);
            fileNames.push(`\uD83D\uDCF7 ${f.file.name}`);
          } catch {
            // Image conversion failed
          }
        } else if (f.content && f.content.length > 0) {
          filesToSend.push({
            name: f.file.name,
            type: f.file.type || 'text/plain',
            content: f.content.substring(0, 50000),
          });
          fileNames.push(`\uD83D\uDCCE ${f.file.name}`);
        } else {
          fileNames.push(`\uD83D\uDCCE ${f.file.name} (non lu)`);
        }
      }

      if (fileNames.length > 0 && !userContent) {
        userContent = "Analyse ce fichier";
      }
    }

    const attachedFilesForMessage: AttachedFile[] = filesToSend.map(f => ({
      name: f.name,
      type: f.type,
      size: f.content.length,
      content: f.content,
    }));

    setMessage("");
    setUploadedFiles([]);

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

  // Any interaction resets the collapse timer
  const onInteraction = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    resetCollapseTimer();
  }, [resetCollapseTimer]);

  return (
    <>
      {/* GPT-Realtime Voice Agent overlay */}
      {voiceMode && (
        <VoiceAgent onClose={() => setVoiceMode(false)} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.xls,.xlsx,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* COLLAPSED — floating bubble */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 ease-in-out"
          title="Ouvrir MAOS Chat"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          {messages.length > 1 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
              {messages.length - 1}
            </span>
          )}
        </button>
      )}

      {/* EXPANDED — chat panel */}
      <div
        className={`flex flex-col h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-0 opacity-0 overflow-hidden pointer-events-none' : 'w-[380px] md:w-[420px] opacity-100'}
          max-md:fixed max-md:inset-0 max-md:z-50 max-md:w-full max-md:h-full max-md:bg-[#0a0f1e]
        `}
        onClick={onInteraction}
        onKeyDown={onInteraction}
        onScroll={onInteraction}
      >
        {/* Header with pin button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-gray-200">MAOS</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPinned(p => !p)}
              className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]'}`}
              title={isPinned ? 'Désépingler (auto-collapse)' : 'Épingler (garder ouvert)'}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors md:hidden"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Message history — scrollable area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                msg={msg}
                onDownloadPDF={downloadPDF}
                onSpeak={speakMessage}
                isSpeaking={speakingMsgContent === msg.content}
              />
            ))}

            {/* Typing indicator — 3 animated dots */}
            {isLoading && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-400">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">MAOS réfléchit</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area — fixed at bottom */}
        <div className="shrink-0 px-4 py-3 border-t border-white/[0.08]">
          <div className="max-w-3xl mx-auto">
            {/* Uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${f.analyzing
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : f.content
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-white/[0.04] border border-white/[0.08]'
                      }`}
                  >
                    {f.analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : f.preview ? (
                      <img src={f.preview} alt="" className="w-8 h-8 object-cover rounded" />
                    ) : (
                      getFileIcon(f.file.type)
                    )}
                    <span className="max-w-32 truncate text-gray-300">{f.file.name}</span>
                    {f.analyzing && <span className="text-amber-400 text-xs">Analyse...</span>}
                    {f.content && !f.analyzing && (
                      <span className="text-emerald-400 text-xs font-medium">Prêt</span>
                    )}
                    <button
                      onClick={() => removeFile(f.file)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input box */}
            <div className="relative bg-white/[0.05] border border-white/[0.08] rounded-2xl transition-colors focus-within:border-white/[0.15]">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => { setMessage(e.target.value); onInteraction(); }}
                onKeyDown={handleKeyDown}
                onFocus={onInteraction}
                placeholder="Demandez à MAOS..."
                disabled={isLoading}
                className="w-full resize-none bg-transparent px-4 py-3 pr-24 text-[15px] text-gray-200 placeholder-gray-500 focus:outline-none disabled:opacity-50 overflow-hidden scrollbar-hide"
                rows={1}
                style={{ minHeight: "48px", maxHeight: "144px" }}
              />

              {/* Action buttons — inside input box, bottom right */}
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {/* Upload button */}
                <button
                  onClick={() => {
                    fileDialogOpenRef.current = true;
                    if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null; }
                    fileInputRef.current?.click();
                  }}
                  disabled={isLoading}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                  title="Joindre un fichier"
                >
                  <Paperclip className="w-[18px] h-[18px]" />
                </button>

                {/* Voice call button */}
                <button
                  onClick={() => setVoiceMode(true)}
                  disabled={isLoading}
                  className="p-2 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                  title="Appeler MAOS"
                >
                  <Phone className="w-[18px] h-[18px]" />
                </button>

                {/* Send button — only visible when text is present */}
                {(message.trim() || uploadedFiles.length > 0) && (
                  <button
                    onClick={handleSend}
                    disabled={isLoading || uploadedFiles.some(f => f.analyzing)}
                    className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                    title="Envoyer"
                  >
                    {uploadedFiles.some(f => f.analyzing) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 text-center mt-2">
              MAOS est une IA et peut faire des erreurs. Vérifiez les informations importantes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
