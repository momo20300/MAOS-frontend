import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * MAOS AI Chat Proxy
 * Routes all chat requests to the NestJS backend for proper agent orchestration.
 *
 * The backend handles:
 * - 50-agent hierarchical system
 * - ERPNext data integration
 * - LLM-based language detection
 * - Role-aware system prompts
 * - PDF report generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, images, files, forcedLang } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({
        message: 'Bonjour! Je suis MAOS, votre assistant intelligent. Comment puis-je vous aider?'
      });
    }

    // Get the last user message
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json({
        message: 'Bonjour! Je suis MAOS, votre assistant intelligent. Comment puis-je vous aider?'
      });
    }

    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('maos_token')?.value;

    if (!token) {
      console.warn('No auth token found, using direct OpenAI fallback');
      return await fallbackToOpenAI(messages, context);
    }

    // Build conversation history for context
    const conversationHistory = messages
      .slice(-10) // Last 10 messages for context
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }));

    // Call the backend orchestrator
    const response = await fetch(`${BACKEND_URL}/api/orchestrator/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: lastUserMessage.content,
        context: {
          ...context,
          conversationHistory,
        },
        images: images || [],
        files: files || [],
        forcedLang,
      }),
    });

    if (!response.ok) {
      console.error('Backend error:', response.status, response.statusText);

      // If backend is unavailable, fallback to direct OpenAI
      if (response.status >= 500) {
        console.warn('Backend unavailable, falling back to OpenAI');
        return await fallbackToOpenAI(messages, context);
      }

      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown backend error');
    }

    // Return the response with all metadata
    return NextResponse.json({
      message: data.data.response,
      pdf: data.data.pdf,
      lang: data.data.lang || 'fr',
      langName: data.data.langName || 'Francais',
      direction: data.data.direction || 'ltr',
      hasTTS: data.data.hasTTS !== false,
      agent: data.data.agent,
      pack: data.data.pack,
      metier: data.data.metier,
    });

  } catch (error: unknown) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        message: 'Je rencontre un probleme technique. Veuillez reessayer.',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * Fallback to direct OpenAI when backend is unavailable
 * This is a degraded mode - no real company data, no agents
 */
async function fallbackToOpenAI(
  messages: Array<{ role: string; content: string }>,
  context?: { pack?: string; metier?: string }
): Promise<NextResponse> {
  const OpenAI = (await import('openai')).default;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  const pack = context?.pack || 'STANDARD';
  const metier = context?.metier || 'gestion_commerciale';

  const systemPrompt = `Tu es MAOS, l'assistant intelligent d'entreprise.

MODE DEGRADE: Le backend est temporairement indisponible.
Tu n'as pas acces aux donnees reelles de l'entreprise.

Ce que tu peux faire:
- Repondre aux questions generales
- Expliquer les fonctionnalites de MAOS
- Aider avec des questions simples

Ce que tu ne peux PAS faire:
- Donner des chiffres de l'entreprise (CA, stock, clients)
- Analyser des donnees
- Generer des rapports

Si l'utilisateur demande des donnees, dis-lui honnement:
"Je n'ai pas acces aux donnees de votre entreprise en ce moment. Le service sera retabli sous peu."

Pack: ${pack}
Metier: ${metier}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-5).map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiMessage = completion.choices[0]?.message?.content ||
      'Desole, je ne peux pas repondre en ce moment.';

    return NextResponse.json({
      message: aiMessage,
      pack,
      metier,
      lang: 'fr',
      langName: 'Francais',
      direction: 'ltr',
      hasTTS: true,
    });
  } catch (openaiError) {
    console.error('OpenAI fallback error:', openaiError);
    return NextResponse.json(
      { message: 'Service temporairement indisponible. Veuillez reessayer plus tard.' },
      { status: 503 }
    );
  }
}
