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
