/**
 * TEMPLAO AI - Analyse intelligente de fichiers
 * Utilise le backend NestJS pour l'analyse
 */

import { authFetch, getAccessToken } from './auth';

export interface TemplaoAnalysis {
  filename: string;
  type: string;
  size: number;
  analysis: string;
  summary: string;
  keyPoints: string[];
  audioUrl?: string;
  pdfUrl?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Analyser un fichier avec Templao AI
 */
export async function analyzeFile(file: File): Promise<TemplaoAnalysis> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = getAccessToken();

    const response = await fetch(`${API_URL}/api/templao/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      // Fallback to client-side analysis if backend endpoint doesn't exist
      return await analyzeFileClientSide(file);
    }

    return await response.json();
  } catch (error) {
    console.error('Templao API error, using client-side fallback:', error);
    return await analyzeFileClientSide(file);
  }
}

/**
 * Client-side file analysis fallback
 */
async function analyzeFileClientSide(file: File): Promise<TemplaoAnalysis> {
  // Extract basic file info
  const filename = file.name;
  const type = file.type || 'unknown';
  const size = file.size;

  // Read file content for text-based files
  let content = '';
  if (type.includes('text') || filename.endsWith('.txt') || filename.endsWith('.csv')) {
    content = await file.text();
  }

  // Generate basic analysis
  const analysis = content
    ? `Contenu du fichier (${content.length} caracteres):\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`
    : `Fichier ${filename} (${formatFileSize(size)})\nType: ${type}\n\nL'analyse detaillee necessite une connexion au backend.`;

  return {
    filename,
    type,
    size,
    analysis,
    summary: `Fichier ${filename} de type ${type} (${formatFileSize(size)})`,
    keyPoints: [
      `Nom: ${filename}`,
      `Taille: ${formatFileSize(size)}`,
      `Type: ${type}`,
    ],
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Generer synthese audio
 */
export async function generateAudio(text: string): Promise<string> {
  try {
    const response = await authFetch('/api/templao/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Audio generation not available');
    }

    const data = await response.json();
    return data.audioUrl;
  } catch (error) {
    console.error('Audio error:', error);
    throw new Error('La generation audio necessite une connexion au backend avec OpenAI configure.');
  }
}

/**
 * Generer rapport PDF
 */
export async function generatePDF(analysis: TemplaoAnalysis): Promise<string> {
  try {
    const response = await authFetch('/api/templao/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis),
    });

    if (!response.ok) {
      throw new Error('PDF generation not available');
    }

    const data = await response.json();
    return data.pdfUrl;
  } catch (error) {
    console.error('PDF error:', error);
    throw new Error('La generation PDF necessite une connexion au backend.');
  }
}
