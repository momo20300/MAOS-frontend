"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, Mic, MicOff, Upload, X, FileText, Image, File, Volume2, VolumeX, Download, Minimize2, Maximize2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessageToAI, Message, fileToBase64, AIResponse, AttachedFile } from "@/lib/services/ai";

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
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
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

  // ===== TEXT-TO-SPEECH (TTS) =====
  // Use browser's Web Speech API for Arabic (FREE), API for other languages
  const speakWithBrowserTTS = (text: string, lang: string = 'ar-MA') => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;

      // Try to find an Arabic voice
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v =>
        v.lang.startsWith('ar') || v.lang.includes('Arab')
      );
      if (arabicVoice) {
        utterance.voice = arabicVoice;
        console.log('🔊 Using Arabic voice:', arabicVoice.name);
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      console.log('🔊 Browser TTS speaking (FREE)');
    } else {
      console.warn('Web Speech API not supported');
      setIsSpeaking(false);
    }
  };

  const speakText = async (text: string, langCode?: string) => {
    if (!ttsEnabled) return;

    try {
      setIsSpeaking(true);

      // Call backend OpenAI TTS endpoint
      // IMPORTANT: Use charset=utf-8 to preserve Arabic/multilingual text
      const ttsText = text.substring(0, 4000);
      console.log('🔊 TTS sending text:', ttsText.substring(0, 100), '...');
      console.log('🔊 TTS text encoding check:', encodeURIComponent(ttsText.substring(0, 50)));

      const response = await fetch('http://localhost:4000/api/speech/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: ttsText,
          lang: langCode, // Pass detected language for accurate TTS
        }),
      });

      if (!response.ok) {
        console.error('TTS API error:', response.status);
        // Fallback to browser TTS
        speakWithBrowserTTS(text, 'fr');
        return;
      }

      // Get language info from headers
      const detectedLang = response.headers.get('X-Language-Code') || 'fr';
      const langName = response.headers.get('X-Language-Name') || 'Français';
      const ttsEngine = response.headers.get('X-TTS-Engine') || 'openai';
      console.log(`🔊 TTS: ${langName} (${detectedLang}) via ${ttsEngine}`);

      // Get audio blob and play
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        console.error('TTS returned empty audio');
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

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      // Fallback to browser TTS
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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Dynamically import xlsx library
          const XLSX = await import('xlsx');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          // Helper to convert Excel date serial to readable date
          const formatExcelValue = (value: any): string => {
            if (value === null || value === undefined) return '';

            // If it's a Date object (from cellDates: true)
            if (value instanceof Date) {
              return value.toLocaleDateString('fr-FR');
            }

            // If it's a number that looks like an Excel date (between 40000 and 50000)
            if (typeof value === 'number' && value > 40000 && value < 60000) {
              try {
                const date = new Date((value - 25569) * 86400 * 1000);
                if (!isNaN(date.getTime())) {
                  return date.toLocaleDateString('fr-FR');
                }
              } catch {
                // Not a date, return as is
              }
            }

            return String(value);
          };

          let content = '';
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) return;
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' }) as any[][];

            content += `=== Feuille: ${sheetName} ===\n`;
            json.slice(0, 100).forEach((row, i) => {
              const formattedRow = row.map(formatExcelValue);
              content += formattedRow.join(' | ') + '\n';
            });
            content += '\n';
          });

          resolve(content);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseTextFile = async (file: File): Promise<string> => {
    return await file.text();
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log('📎 handleFileSelect called with', files.length, 'file(s)');

    for (const file of Array.from(files)) {
      console.log(`📎 Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);
      const newFile: UploadedFile = { file, analyzing: true };

      if (file.type.startsWith('image/')) {
        newFile.preview = URL.createObjectURL(file);
      }

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        let content = '';
        const ext = file.name.split('.').pop()?.toLowerCase();
        console.log(`📎 File extension: ${ext}`);

        if (ext === 'xlsx' || ext === 'xls') {
          console.log('📎 Parsing Excel file...');
          content = await parseExcelFile(file);
        } else if (ext === 'csv' || ext === 'txt') {
          console.log('📎 Parsing text/CSV file...');
          content = await parseTextFile(file);
        } else if (ext === 'pdf') {
          content = `[Fichier PDF: ${file.name}] - Extraction du contenu en cours...`;
        } else if (file.type.startsWith('image/')) {
          content = `[Image: ${file.name}] - Image uploadée pour analyse visuelle`;
        } else {
          content = `[Fichier: ${file.name}] - Type: ${file.type || 'inconnu'}`;
        }

        console.log(`📎 Parsed content length: ${content.length} chars`);
        console.log(`📎 Content preview: ${content.substring(0, 200)}...`);

        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === file ? { ...f, content, analyzing: false } : f
          )
        );
      } catch (error) {
        console.error("📎 Erreur parsing:", error);
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
    console.log('📄 downloadPDF called:', { filename, dataLength: pdfData?.length });
    try {
      if (!pdfData || pdfData.length === 0) {
        console.error('PDF data is empty');
        alert('Erreur: Le PDF est vide');
        return;
      }

      // Convert base64 to blob
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      console.log('📄 PDF blob created:', { size: blob.size });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('📄 PDF download initiated successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Erreur lors du téléchargement du PDF: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
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

    } catch (error) {
      console.error("Erreur micro:", error);
      alert("Impossible d'accéder au microphone. Vérifiez les permissions du navigateur.");
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
      } else {
        console.warn("Transcription vide");
      }
    } catch (error) {
      console.error("Erreur transcription:", error);
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

    console.log('🎤 handleSendWithText called with voice input');
    console.log('🎤 uploadedFiles:', uploadedFiles.length, 'files');

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
          } catch (err) {
            console.error('Error converting image:', err);
          }
        } else if (f.content && f.content.length > 0) {
          console.log(`🎤 Including file: ${f.file.name} (${f.content.length} chars)`);
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
      console.log('🎤 Sending to backend:', {
        filesCount: filesToSend.length,
        imagesCount: imagesToSend.length,
      });

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

      if (aiResponse.pdf) {
        console.log('📄 Adding PDF to message:', {
          filename: aiResponse.pdf.filename,
          dataLength: aiResponse.pdf.data?.length,
        });
      }

      setMessages([...newMessages, assistantMessage]);

      // Auto-play TTS avec voix OpenAI naturelle
      if (ttsEnabled && aiResponse.message && aiResponse.hasTTS) {
        speakText(aiResponse.message, aiResponse.lang);
      }
    } catch (error) {
      console.error("💔 Erreur:", error);
      setMessages([...newMessages, {
        role: "assistant" as const,
        content: "Une erreur technique est survenue. Veuillez réessayer."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    console.log('📤 handleSend called');
    console.log('📤 uploadedFiles:', uploadedFiles.length, 'files');
    uploadedFiles.forEach((f, i) => {
      console.log(`📤 File ${i}: ${f.file.name}, analyzing=${f.analyzing}, contentLength=${f.content?.length || 0}`);
    });

    // Check if any file is still being analyzed
    const filesStillAnalyzing = uploadedFiles.some(f => f.analyzing);
    if (filesStillAnalyzing) {
      alert('Veuillez attendre que tous les fichiers soient analysés avant d\'envoyer.');
      return;
    }

    if ((!message.trim() && uploadedFiles.length === 0) || isLoading) return;

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
          } catch (err) {
            console.error('Error converting image:', err);
          }
        } else if (f.content && f.content.length > 0) {
          // For other files (CSV, Excel, TXT), send as separate file object
          console.log(`📎 Preparing file for backend: ${f.file.name} (${f.content.length} chars)`);
          filesToSend.push({
            name: f.file.name,
            type: f.file.type || 'text/plain',
            content: f.content.substring(0, 50000), // Limit to 50KB
          });
          fileNames.push(`📎 ${f.file.name}`);
        } else {
          console.warn(`⚠️ File without content: ${f.file.name}`);
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
      // Send with images AND files
      console.log('📤 Sending to backend:', {
        messageCount: newMessages.length,
        imagesCount: imagesToSend.length,
        filesCount: filesToSend.length,
        fileNames: filesToSend.map(f => f.name)
      });

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
      if (aiResponse.pdf) {
        console.log('📄 Adding PDF to message:', {
          filename: aiResponse.pdf.filename,
          dataLength: aiResponse.pdf.data?.length,
        });
      }

      setMessages([...newMessages, assistantMessage]);

      // Auto-play TTS avec voix OpenAI naturelle
      if (ttsEnabled && aiResponse.message && aiResponse.hasTTS) {
        speakText(aiResponse.message, aiResponse.lang);
      }
    } catch (error) {
      console.error("💔 Erreur:", error);
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
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center shadow-2xl z-50 hover:scale-110 transition-transform"
          title="Ouvrir MAOS Chat"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          {messages.length > 1 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-green-600 text-white"
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
                              className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                                msg.role === "user"
                                  ? "bg-green-700/50"
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
                          onClick={() => {
                            console.log('📄 Download button clicked for:', msg.pdf!.filename);
                            downloadPDF(msg.pdf!.data, msg.pdf!.filename);
                          }}
                          className="mt-3 bg-green-600 hover:bg-green-700 text-white"
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center flex-shrink-0 animate-pulse">
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
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    f.analyzing
                      ? 'bg-yellow-100 border border-yellow-300 dark:bg-yellow-900/30'
                      : f.content
                        ? 'bg-green-100 border border-green-300 dark:bg-green-900/30'
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
                    <span className="text-green-600 text-xs font-medium">✓ Prêt ({Math.round(f.content.length / 1024)}KB)</span>
                  )}
                  <button
                    onClick={() => removeFile(f.file)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-shrink-0 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center">
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
              className={`h-10 w-10 rounded-lg flex-shrink-0 mb-2 ${
                isSpeaking ? 'animate-pulse' : ttsEnabled ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
              title={isSpeaking ? "Arrêter MAOS" : ttsEnabled ? "Désactiver la voix" : "Activer la voix"}
            >
              {isSpeaking ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className={`h-5 w-5 ${ttsEnabled ? 'text-white' : 'text-green-600'}`} />
              )}
            </Button>

            {/* Bouton Upload */}
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="h-10 w-10 rounded-lg flex-shrink-0 mb-2 hover:bg-green-50 hover:border-green-600"
              title="Joindre un fichier"
            >
              <Upload className="h-5 w-5 text-green-600" />
            </Button>

            {/* Bouton Micro */}
            <Button
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing}
              className={`h-10 w-10 rounded-lg flex-shrink-0 mb-2 ${
                isRecording
                  ? "animate-pulse"
                  : "hover:bg-green-50 hover:border-green-600"
              }`}
              title={isRecording ? "Arrêter l'enregistrement" : "Parler à MAOS"}
            >
              {isTranscribing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5 text-green-600" />
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
                className="w-full resize-none rounded-xl border bg-background px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all overflow-hidden scrollbar-hide disabled:opacity-50"
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
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all"
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
              <p className="text-xs text-muted-foreground">🌐 Auto</p>
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
                  className="h-5 px-2 text-xs text-green-600"
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
            <p className="text-xs text-green-600 font-medium">
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
