"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, Mic, Upload, X, FileText, Image, File, Download, Minimize2, Maximize2, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessageToAI, sendMessageStreamingSSE, Message, fileToBase64, AttachedFile, StreamingCallbacks } from "@/lib/services/ai";
import dynamic from "next/dynamic";

const VoiceAgent = dynamic(() => import("./VoiceAgent"), { ssr: false });

interface UploadedFile {
  file: File;
  preview?: string;
  content?: string;
  analyzing?: boolean;
}

export default function MaosTalk() {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pack, setPack] = useState<string>("PRO");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [useStreaming, setUseStreaming] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [sessionId] = useState(() => `maos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  // Auto-hide after 10 seconds of inactivity
  useEffect(() => {
    if (isMinimized || isLoading) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

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
  }, [lastActivityTime, isMinimized, isLoading]);

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
      content: "Bonjour. Je suis MAOS, votre assistant num\u00e9rique. Comment puis-je vous aider ?",
      lang: "fr",
      langName: "Fran\u00e7ais",
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
          content = `[Image: ${file.name}] - Image upload\u00e9e pour analyse visuelle`;
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
  const handleSendStreaming = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setMessage("");

    const userMessage: Message = {
      role: "user" as const,
      content: textToSend.trim(),
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
        setIsLoading(false);
        setMessages(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          const lastMsg = updated[lastIndex];
          if (lastMsg && lastMsg.role === "assistant") {
            updated[lastIndex] = {
              ...lastMsg,
              content: "Une erreur est survenue. Veuillez r\u00e9essayer.",
            };
          }
          return updated;
        });
      },
    };

    try {
      await sendMessageStreamingSSE(textToSend.trim(), callbacks, { wantAudio: false, sessionId });
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
        content: "Une erreur technique est survenue. Veuillez r\u00e9essayer."
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

      {/* MODE MINIMIS\u00c9 - Juste un bouton flottant */}
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
                      {/* Fichiers attach\u00e9s - affich\u00e9s DANS la bulle */}
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
                          T\u00e9l\u00e9charger le PDF
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
                      <p className="text-sm text-muted-foreground">MAOS r\u00e9fl\u00e9chit...</p>
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
              {/* Fichiers upload\u00e9s */}
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
                        <span className="text-success-400 text-xs font-medium">\u2713 Pr\u00eat ({Math.round(f.content.length / 1024)}KB)</span>
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
                    ) : (
                      <Sparkles className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { setIsExpanded(true); resetActivityTimer(); }}
                    placeholder="Parle \u00e0 MAOS..."
                    disabled={isLoading}
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

                {/* Bouton Agent Vocal (GPT-Realtime) */}
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => { setVoiceMode(true); resetActivityTimer(); }}
                  disabled={isLoading}
                  className="h-10 w-10 rounded-lg flex-shrink-0 mb-2 hover:bg-success-50 hover:border-success-400"
                  title="Agent vocal MAOS"
                >
                  <Mic className="h-5 w-5 text-success-400" />
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
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    MAOS AI {pack}
                  </p>
                  <span className="text-xs text-muted-foreground">\u2022</span>
                  <button
                    onClick={() => setUseStreaming(!useStreaming)}
                    className={`text-xs flex items-center gap-1 ${useStreaming ? 'text-success-400 font-medium' : 'text-muted-foreground'}`}
                    title={useStreaming ? 'Mode streaming activ\u00e9 (r\u00e9ponses rapides)' : 'Activer le streaming'}
                  >
                    <Zap className={`w-3 h-3 ${useStreaming ? 'fill-current' : ''}`} />
                    {useStreaming ? 'Stream' : 'Standard'}
                  </button>
                  <span className="text-xs text-muted-foreground">\u2022</span>
                  {/* Boutons R\u00e9duire et Masquer */}
                  {isExpanded ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsExpanded(false); resetActivityTimer(); }}
                      className="h-5 px-2 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Minimize2 className="w-3 h-3 mr-1" />
                      R\u00e9duire
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
                  \uD83D\uDC9A En ligne
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
