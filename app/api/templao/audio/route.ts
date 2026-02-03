import { NextRequest, NextResponse } from 'next/server';

// OpenAI TTS (pour français, anglais, etc.)
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

// Azure TTS - 5 MILLIONS de caractères GRATUITS/mois
// Obtenez votre clé sur https://portal.azure.com → Speech resource
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'francecentral';

// Google Cloud TTS - 4 millions de caractères GRATUITS/mois (alternative)
const GOOGLE_TTS_KEY = process.env.GOOGLE_TTS_KEY || '';

// Detect if text contains Arabic/Amazigh characters
const containsArabic = (text: string): boolean => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u2D30-\u2D7F]/;
  return arabicPattern.test(text);
};

// Detect if text is predominantly Arabic/Amazigh (more than 30% Arabic chars)
const isPredominantlyArabic = (text: string): boolean => {
  const arabicChars = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u2D30-\u2D7F]/g) || [];
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && (arabicChars.length / totalChars) > 0.3;
};

// Generate TTS with Azure (5M chars FREE/month - BEST FOR ARABIC)
async function generateAzureTTS(text: string): Promise<ArrayBuffer | null> {
  if (!AZURE_SPEECH_KEY) {
    console.log('⚠️ Azure Speech key not configured');
    return null;
  }

  console.log('🔊 Génération audio TTS (Azure - GRATUIT pour arabe)...');

  try {
    // SSML for better Arabic pronunciation
    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ar-MA'>
        <voice name='ar-MA-MounaNeural'>
          <prosody rate='0.95' pitch='0%'>
            ${text.substring(0, 5000).replace(/[<>&]/g, '')}
          </prosody>
        </voice>
      </speak>
    `;

    const response = await fetch(
      `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        body: ssml,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Azure TTS error:', response.status, errorText);
      return null;
    }

    console.log('✅ Audio Azure généré (GRATUIT)');
    return await response.arrayBuffer();
  } catch (error) {
    console.error('❌ Azure TTS exception:', error);
    return null;
  }
}

// Generate TTS with OpenAI (for French, English, etc.)
async function generateOpenAITTS(text: string): Promise<ArrayBuffer | null> {
  console.log('🔊 Génération audio TTS (OpenAI tts-1-hd)...');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        voice: 'alloy',
        input: text.substring(0, 4000),
        speed: 0.92,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI TTS error:', response.status, errorText);
      return null;
    }

    console.log('✅ Audio OpenAI généré');
    return await response.arrayBuffer();
  } catch (error) {
    console.error('❌ OpenAI TTS exception:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Texte manquant' },
        { status: 400 }
      );
    }

    let audioBuffer: ArrayBuffer | null = null;

    // For Arabic/Amazigh: Use Azure TTS (5M chars FREE/month)
    // For other languages: Use OpenAI TTS
    if (isPredominantlyArabic(text)) {
      console.log('🌍 Texte arabe/amazigh détecté');

      // Try Azure first (FREE tier)
      audioBuffer = await generateAzureTTS(text);

      // Fallback to OpenAI if Azure not configured
      if (!audioBuffer) {
        console.log('🔄 Azure non configuré, fallback vers OpenAI...');
        audioBuffer = await generateOpenAITTS(text);
      }
    } else {
      audioBuffer = await generateOpenAITTS(text);
    }

    if (!audioBuffer) {
      return NextResponse.json(
        { error: 'Échec de la génération audio' },
        { status: 500 }
      );
    }

    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl: audioDataUrl,
    });

  } catch (error: any) {
    console.error('❌ TTS erreur:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
