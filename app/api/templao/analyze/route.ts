import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }
    
    console.log('📄 Templao analyse:', file.name, file.type, file.size);
    
    // Convertir en base64 pour OpenAI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    const fileType = file.type;
    let analysis = '';
    
    // Analyse selon type
    if (fileType.includes('image')) {
      // Vision API pour images
      analysis = await analyzeImage(base64, fileType);
    } else if (fileType.includes('pdf')) {
      // Extraction PDF puis analyse
      analysis = await analyzePDF(buffer);
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      // Analyse Excel
      analysis = await analyzeExcel(buffer);
    } else if (fileType.includes('word') || fileType.includes('document')) {
      // Analyse Word
      analysis = await analyzeWord(buffer);
    } else {
      // Texte brut
      const text = buffer.toString('utf-8');
      analysis = await analyzeText(text);
    }
    
    // Générer résumé et points clés
    const summary = await generateSummary(analysis);
    const keyPoints = await extractKeyPoints(analysis);
    
    return NextResponse.json({
      filename: file.name,
      type: file.type,
      size: file.size,
      analysis,
      summary,
      keyPoints,
    });
    
  } catch (error: any) {
    console.error('❌ Templao erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur analyse' },
      { status: 500 }
    );
  }
}

async function analyzeImage(base64: string, mimeType: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyse cette image en détail. Décris ce que tu vois, les éléments importants, et toute information pertinente pour un usage professionnel.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });
  
  return response.choices[0]?.message?.content || 'Analyse impossible';
}

async function analyzePDF(buffer: Buffer): Promise<string> {
  // Pour l'instant, analyse basique
  // TODO: Intégrer pdf-parse
  return 'Analyse PDF en cours de développement. Le contenu sera extrait et analysé prochainement.';
}

async function analyzeExcel(buffer: Buffer): Promise<string> {
  // TODO: Intégrer xlsx
  return 'Analyse Excel en cours de développement. Les données seront extraites et analysées prochainement.';
}

async function analyzeWord(buffer: Buffer): Promise<string> {
  // TODO: Intégrer mammoth
  return 'Analyse Word en cours de développement. Le contenu sera extrait et analysé prochainement.';
}

async function analyzeText(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Tu es Templao AI, l\'assistant d\'analyse de documents de MAOS. Analyse les documents de manière professionnelle et exhaustive.',
      },
      {
        role: 'user',
        content: `Analyse ce document:\n\n${text.substring(0, 10000)}`,
      },
    ],
    max_tokens: 1500,
  });
  
  return response.choices[0]?.message?.content || 'Analyse impossible';
}

async function generateSummary(analysis: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Génère un résumé très concis (2-3 phrases) de cette analyse.',
      },
      {
        role: 'user',
        content: analysis.substring(0, 5000),
      },
    ],
    max_tokens: 200,
  });
  
  return response.choices[0]?.message?.content || '';
}

async function extractKeyPoints(analysis: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Extrait 3-5 points clés de cette analyse. Réponds uniquement avec une liste JSON ["point1", "point2", ...]',
      },
      {
        role: 'user',
        content: analysis.substring(0, 5000),
      },
    ],
    max_tokens: 300,
  });
  
  const content = response.choices[0]?.message?.content || '[]';
  try {
    return JSON.parse(content);
  } catch {
    return ['Analyse complète', 'Points clés identifiés', 'Données extraites'];
  }
}
