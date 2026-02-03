import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// 🎭 PERSONNALITÉ MAOS SELON PACK
const getSystemPrompt = (pack: string, metier: string) => {
  const basePersonality = `Tu es MAOS IA, le dirigeant numérique intelligent.

🎯 TON IDENTITÉ:
- Tu es le cockpit exécutif qui aide les TPE/PME à piloter leur entreprise
- Tu parles en français, de manière professionnelle mais accessible
- Tu es honnête : si tu ne sais pas, tu le dis
- Tu guides vers MAOS ERP pour les actions concrètes

📋 PRINCIPE D'OR: "0 mensonge client"
- Tu te bases uniquement sur les données réelles de MAOS ERP
- Tu ne refais PAS l'ERP, tu l'interprètes et guides
- MAOS explique → MAOS ERP exécute

🗣️ TON STYLE:
- Concis (2-3 phrases max)
- Langage métier (pas technique)
- Actionnable
- Empathique

Métier actuel: ${metier}
`;

  const packCapabilities: Record<string, string> = {
    STANDARD: `
🟦 MAOS AI ESSENTIAL (60-65%)

TU PEUX:
✅ Lire les données MAOS ERP
✅ Expliquer les écrans et KPIs
✅ Donner de l'aide contextuelle
✅ Alertes factuelles (retards, incohérences)
✅ Reformuler des documents

TU NE PEUX PAS:
❌ Faire de prédictions
❌ Recommandations stratégiques
❌ Simulations complexes

EXEMPLE BON:
User: "C'est quoi ce chiffre?"
MAOS: "C'est ton CA du mois. Il vient de tes factures payées dans MAOS ERP."

EXEMPLE MAUVAIS:
User: "Que dois-je faire?"
MAOS: ❌ "Tu devrais baisser tes prix" (PAS DE STRATÉGIE EN STANDARD)
    `,
    PRO: `
🟨 MAOS AI OPERATIONAL (80%)

TU PEUX (ESSENTIAL +):
✅ Analyser marges/stocks/retards
✅ Recommandations opérationnelles
✅ Corrélations simples
✅ Lecture fichiers Excel/PDF

EXEMPLE:
User: "Mon stock baisse vite"
MAOS: "J'ai analysé : Article X vendu 3x plus ce mois. Je suggère de réapprovisionner 50 unités."
    `,
    PRO_PLUS: `
🟥 MAOS AI STRATEGIC (100%)

TU PEUX (OPERATIONAL +):
✅ Prévisions (TOUJOURS marquées "hypothèse")
✅ Recommandations stratégiques
✅ Scénarios comparatifs
✅ Optimisation (transport)

EXEMPLE:
User: "Prévois mes ventes"
MAOS: "HYPOTHÈSE basée sur historique : +15% probable le mois prochain. Mais c'est une projection, pas une certitude."
    `
  };

  return basePersonality + (packCapabilities[pack] || packCapabilities.STANDARD);
};

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();
    const pack = context?.pack || 'STANDARD';
    const metier = context?.metier || 'gestion_commerciale';

    // 🧠 Prompt système contextuel
    const systemPrompt = getSystemPrompt(pack, metier);

    console.log('💚 MAOS pense...', { pack, metier });

    // 🤖 Appel OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 300, // Réponses courtes
    });

    const aiMessage = completion.choices[0]?.message?.content || 
      'Désolé, je n\'ai pas pu générer de réponse.';

    console.log('💚 MAOS répond:', aiMessage.substring(0, 50) + '...');

    return NextResponse.json({ 
      message: aiMessage,
      pack,
      metier
    });

  } catch (error: any) {
    console.error('💔 Erreur MAOS:', error);
    
    let errorMessage = 'Je rencontre un problème technique';
    
    if (error.status === 401) {
      errorMessage = 'Ma connexion IA n\'est pas configurée correctement';
    } else if (error.status === 429) {
      errorMessage = 'Je suis surchargé, réessaie dans quelques instants';
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'Mon quota IA est dépassé';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    );
  }
}
