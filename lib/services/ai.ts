import { authFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  pdf?: { data: string; filename: string }; // PDF attachment if any
  files?: AttachedFile[]; // Files attached to this message
  // Language info for assistant messages
  lang?: string;
  langName?: string;
  direction?: 'ltr' | 'rtl';
}

export interface SendMessageOptions {
  context?: Record<string, unknown>;
  images?: string[]; // Base64 encoded images
  files?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
  forcedLang?: string; // Force response language (e.g., 'fr', 'ar-MA', 'shi')
}

export interface AIResponse {
  message: string;
  pdf?: { data: string; filename: string };
  // Language info from backend
  lang?: string;
  langName?: string;
  direction?: 'ltr' | 'rtl';
  hasTTS?: boolean;
}

export async function sendMessageToAI(
  messages: Message[],
  options?: SendMessageOptions
): Promise<AIResponse> {
  try {
    const payload = {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      context: options?.context,
      images: options?.images || [],
      files: options?.files || [],
      forcedLang: options?.forcedLang, // Force response language
    };

    const response = await authFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    const data = await response.json();

    return {
      message: data.message || 'Je n\'ai pas pu traiter votre demande.',
      pdf: data.pdf, // Include PDF if present
      // Language info
      lang: data.lang || 'fr',
      langName: data.langName || 'Français',
      direction: data.direction || 'ltr',
      hasTTS: data.hasTTS !== false,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Streaming callbacks for real-time response
 */
export interface StreamingCallbacks {
  onTextChunk: (text: string) => void;
  onSentenceComplete?: (sentence: string, index: number) => void;
  onAudioReady?: (audioBase64: string, index: number) => void;
  onComplete: (fullText: string, processingTime: number, audioCount?: number) => void;
  onError: (error: string) => void;
  onPdfReady?: (pdfData: string, filename: string, reportTitle: string) => void;
}

/**
 * Send message with streaming response using Server-Sent Events
 * Returns faster perceived response by streaming text + audio in parallel
 */
export async function sendMessageStreamingSSE(
  message: string,
  callbacks: StreamingCallbacks,
  options?: { wantAudio?: boolean; sessionId?: string }
): Promise<void> {
  const token = localStorage.getItem('maos_access_token');
  if (!token) {
    callbacks.onError('Non authentifié');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/stream/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message,
        wantAudio: options?.wantAudio ?? true,
        sessionId: options?.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    // IMPORTANT: eventType must persist across reader.read() calls
    // because large payloads (audio base64) are split across chunks
    let eventType = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const eventData = line.slice(6);
          if (eventType && eventData) {
            try {
              const data = JSON.parse(eventData);
              handleSSEEvent(eventType, data, callbacks);
            } catch {
              // JSON parse failed — partial data, keep eventType for next chunk
              continue;
            }
            eventType = '';
          }
        }
      }
    }

    // Flush remaining buffer after stream ends (handles fast responses like greetings)
    if (buffer.trim()) {
      const remainingLines = buffer.split('\n');
      for (const line of remainingLines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const eventData = line.slice(6);
          if (eventType && eventData) {
            try {
              const data = JSON.parse(eventData);
              handleSSEEvent(eventType, data, callbacks);
            } catch {
              // ignore
            }
            eventType = '';
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'Erreur de streaming');
  }
}

function handleSSEEvent(
  event: string,
  data: any,
  callbacks: StreamingCallbacks
): void {
  switch (event) {
    case 'text':
      callbacks.onTextChunk(data.chunk);
      break;
    case 'sentence':
      callbacks.onSentenceComplete?.(data.text, data.index);
      break;
    case 'audio':
      callbacks.onAudioReady?.(data.data, data.index);
      break;
    case 'complete':
      callbacks.onComplete(data.fullText, data.processingTime || 0, data.audioCount);
      break;
    case 'pdf_ready':
      if (callbacks.onPdfReady) {
        callbacks.onPdfReady(data.data, data.filename, data.reportTitle);
      }
      break;
    case 'error':
      callbacks.onError(data.message);
      break;
  }
}
