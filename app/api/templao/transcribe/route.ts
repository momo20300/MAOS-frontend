import { NextRequest, NextResponse } from 'next/server';

// OpenAI API Key from environment
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Fichier audio manquant' },
        { status: 400 }
      );
    }

    console.log('🎤 Transcription audio avec Whisper...');
    console.log(`   Taille: ${audioFile.size} bytes, Type: ${audioFile.type}`);

    // Prepare form data for OpenAI
    // Ne pas forcer la langue pour permettre arabe, berbère, français, etc.
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile, 'audio.webm');
    openaiFormData.append('model', 'whisper-1');
    // PAS de language fixe - Whisper détecte automatiquement
    // Cela permet arabe (العربية), berbère, français, anglais, etc.
    openaiFormData.append('response_format', 'json');

    // Call OpenAI Whisper API directly
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI Whisper error:', response.status, errorText);
      return NextResponse.json(
        { error: `Whisper API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Transcription réussie:', data.text?.substring(0, 100));

    return NextResponse.json({
      text: data.text || '',
    });

  } catch (error: any) {
    console.error('❌ Transcription erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur de transcription' },
      { status: 500 }
    );
  }
}
