import { authFetch } from './auth';

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

    // Debug log
    if (options?.files && options.files.length > 0) {
      console.log('📎 Sending files to backend:', options.files.map(f => ({ name: f.name, contentLength: f.content.length })));
    }

    const response = await authFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    const data = await response.json();

    // Log PDF data for debugging
    if (data.pdf) {
      console.log('📄 PDF received from backend:', {
        filename: data.pdf.filename,
        dataLength: data.pdf.data?.length,
      });
    }

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
    console.error('Backend erreur:', error);
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
  onSentenceComplete: (sentence: string, index: number) => void;
  onAudioReady: (audioBase64: string, index: number) => void;
  onComplete: (fullText: string, processingTime: number, audioCount?: number) => void;
  onError: (error: string) => void;
}

/**
 * Send message with streaming response using Server-Sent Events
 * Returns faster perceived response by streaming text + audio in parallel
 */
export async function sendMessageStreamingSSE(
  message: string,
  callbacks: StreamingCallbacks,
  options?: { wantAudio?: boolean }
): Promise<void> {
  const token = localStorage.getItem('maos_access_token');
  if (!token) {
    callbacks.onError('Non authentifié');
    return;
  }

  try {
    const response = await fetch('http://localhost:4000/api/stream/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message,
        wantAudio: options?.wantAudio ?? true,
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
          if (eventType && eventData) {
            try {
              const data = JSON.parse(eventData);
              handleSSEEvent(eventType, data, callbacks);
            } catch (e) {
              console.warn('Failed to parse SSE data:', eventData);
            }
            eventType = '';
            eventData = '';
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
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
      callbacks.onSentenceComplete(data.text, data.index);
      break;
    case 'audio':
      callbacks.onAudioReady(data.data, data.index);
      break;
    case 'complete':
      callbacks.onComplete(data.fullText, data.processingTime || 0, data.audioCount);
      break;
    case 'error':
      callbacks.onError(data.message);
      break;
  }
}
