import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Templao AI Document Analysis
 *
 * Capabilities:
 * - Images: GPT-4 Vision analysis
 * - PDF: Text extraction + AI analysis
 * - Excel/CSV: Data extraction + AI analysis
 * - Word: Text extraction + AI analysis
 * - Text: Direct AI analysis
 *
 * Returns: analysis, summary, keyPoints, extractedData
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prompt = formData.get('prompt') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    console.log('Templao analyse:', file.name, file.type, file.size);

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    let analysis = '';
    let extractedData: Record<string, unknown> = {};
    let rawContent = '';

    // Analyze based on file type
    if (fileType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
      // Vision API for images
      const result = await analyzeImage(base64, fileType, prompt);
      analysis = result.analysis;
    } else if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      // PDF extraction + analysis
      const result = await analyzePDF(buffer, prompt);
      analysis = result.analysis;
      rawContent = result.rawContent;
      extractedData = result.extractedData;
    } else if (
      fileType.includes('sheet') ||
      fileType.includes('excel') ||
      fileName.match(/\.(xlsx|xls|csv)$/)
    ) {
      // Excel/CSV analysis
      const result = await analyzeExcel(buffer, fileName, prompt);
      analysis = result.analysis;
      rawContent = result.rawContent;
      extractedData = result.extractedData;
    } else if (
      fileType.includes('word') ||
      fileType.includes('document') ||
      fileName.match(/\.(docx|doc)$/)
    ) {
      // Word analysis
      const result = await analyzeWord(buffer, prompt);
      analysis = result.analysis;
      rawContent = result.rawContent;
    } else {
      // Plain text
      const text = buffer.toString('utf-8');
      rawContent = text;
      analysis = await analyzeText(text, prompt);
    }

    // Generate summary and key points
    const summary = await generateSummary(analysis);
    const keyPoints = await extractKeyPoints(analysis);

    return NextResponse.json({
      filename: file.name,
      type: file.type,
      size: file.size,
      analysis,
      summary,
      keyPoints,
      extractedData,
      rawContent: rawContent.substring(0, 50000), // Limit raw content
    });

  } catch (error: unknown) {
    console.error('Templao erreur:', error);
    const message = error instanceof Error ? error.message : 'Erreur analyse';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// ============================================================================
// Image Analysis (GPT-4 Vision)
// ============================================================================

async function analyzeImage(
  base64: string,
  mimeType: string,
  customPrompt?: string
): Promise<{ analysis: string }> {
  const prompt = customPrompt || `Analyse cette image en detail pour un usage professionnel MAOS.

Instructions:
1. Decris ce que tu vois (documents, factures, graphiques, tableaux, etc.)
2. Extrait les informations cles (montants, dates, noms, numeros)
3. Identifie le type de document si applicable
4. Donne des recommandations basees sur le contenu

Reponds en francais de maniere structuree.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    return {
      analysis: response.choices[0]?.message?.content || 'Analyse impossible',
    };
  } catch (error) {
    console.error('Image analysis error:', error);
    return { analysis: 'Erreur lors de l\'analyse de l\'image.' };
  }
}

// ============================================================================
// PDF Analysis
// ============================================================================

async function analyzePDF(
  buffer: Buffer,
  customPrompt?: string
): Promise<{ analysis: string; rawContent: string; extractedData: Record<string, unknown> }> {
  try {
    // Dynamic import for pdf-parse (handle both ESM and CJS exports)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import('pdf-parse') as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const pdfData = await pdfParse(buffer);
    const rawContent = pdfData.text || '';

    console.log(`PDF parsed: ${pdfData.numpages} pages, ${rawContent.length} chars`);

    if (!rawContent.trim()) {
      return {
        analysis: 'Le PDF ne contient pas de texte extractible. Il s\'agit peut-etre d\'un PDF image. Utilisez l\'OCR pour l\'analyser.',
        rawContent: '',
        extractedData: { pages: pdfData.numpages, info: pdfData.info },
      };
    }

    // Analyze with AI
    const analysis = await analyzeText(rawContent, customPrompt || 'Analyse ce document PDF de maniere professionnelle.');

    // Extract structured data
    const extractedData: Record<string, unknown> = {
      pages: pdfData.numpages,
      info: pdfData.info,
      metadata: pdfData.metadata,
    };

    // Try to extract numbers/amounts
    const amounts = rawContent.match(/[\d\s]+[,.]?\d*\s*(MAD|DH|EUR|USD|\$|€)/gi);
    if (amounts) {
      extractedData.detectedAmounts = amounts.slice(0, 10);
    }

    // Try to extract dates
    const dates = rawContent.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
    if (dates) {
      extractedData.detectedDates = [...new Set(dates)].slice(0, 10);
    }

    return { analysis, rawContent, extractedData };

  } catch (error) {
    console.error('PDF analysis error:', error);
    return {
      analysis: 'Erreur lors de l\'extraction du PDF. Le fichier pourrait etre corrompu ou protege.',
      rawContent: '',
      extractedData: {},
    };
  }
}

// ============================================================================
// Excel/CSV Analysis
// ============================================================================

async function analyzeExcel(
  buffer: Buffer,
  fileName: string,
  customPrompt?: string
): Promise<{ analysis: string; rawContent: string; extractedData: Record<string, unknown> }> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);

    const sheetNames = workbook.worksheets.map(s => s.name);

    let rawContent = '';
    const extractedData: Record<string, unknown> = {
      sheets: sheetNames,
      sheetCount: sheetNames.length,
    };

    // Process each sheet (limit to 5)
    const sheetsData: Record<string, unknown[]> = {};

    for (const sheet of workbook.worksheets.slice(0, 5)) {
      const jsonData: unknown[][] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 100) return;
        const values = row.values as any[];
        jsonData.push(values.slice(1)); // ExcelJS row.values is 1-indexed
      });

      // Convert to readable text
      const sheetText = jsonData
        .map((row: unknown[]) => row.map(v => v ?? '').join(' | '))
        .join('\n');

      rawContent += `\n=== Feuille: ${sheet.name} ===\n${sheetText}\n`;
      sheetsData[sheet.name] = jsonData.slice(0, 50);

      // Extract stats
      const numericValues = jsonData.flat().filter((v): v is number => typeof v === 'number');
      if (numericValues.length > 0) {
        extractedData[`${sheet.name}_stats`] = {
          rowCount: jsonData.length,
          sum: numericValues.reduce((a, b) => a + b, 0),
          avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
        };
      }
    }

    extractedData.data = sheetsData;

    console.log(`Excel parsed: ${sheetNames.length} sheets, ${rawContent.length} chars`);

    // Analyze with AI
    const prompt = customPrompt || `Analyse ce fichier Excel/CSV de maniere professionnelle pour MAOS.

Instructions:
1. Identifie le type de donnees (ventes, stock, clients, finances, etc.)
2. Resume les informations cles (totaux, tendances, anomalies)
3. Donne des insights business
4. Suggere des actions si pertinent

Reponds en francais.`;

    const analysis = await analyzeText(rawContent, prompt);

    return { analysis, rawContent, extractedData };

  } catch (error) {
    console.error('Excel analysis error:', error);
    return {
      analysis: 'Erreur lors de l\'analyse du fichier Excel. Verifiez le format du fichier.',
      rawContent: '',
      extractedData: {},
    };
  }
}

// ============================================================================
// Word Document Analysis
// ============================================================================

async function analyzeWord(
  buffer: Buffer,
  customPrompt?: string
): Promise<{ analysis: string; rawContent: string }> {
  try {
    // Dynamic import for mammoth
    const mammoth = await import('mammoth');

    const result = await mammoth.extractRawText({ buffer });
    const rawContent = result.value || '';

    console.log(`Word parsed: ${rawContent.length} chars`);

    if (!rawContent.trim()) {
      return {
        analysis: 'Le document Word est vide ou ne contient pas de texte extractible.',
        rawContent: '',
      };
    }

    // Analyze with AI
    const analysis = await analyzeText(rawContent, customPrompt || 'Analyse ce document Word de maniere professionnelle.');

    return { analysis, rawContent };

  } catch (error) {
    console.error('Word analysis error:', error);
    return {
      analysis: 'Erreur lors de l\'extraction du document Word.',
      rawContent: '',
    };
  }
}

// ============================================================================
// Text Analysis (AI)
// ============================================================================

async function analyzeText(text: string, customPrompt?: string): Promise<string> {
  const prompt = customPrompt || 'Analyse ce document de maniere professionnelle pour MAOS.';

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es Templao AI, l'assistant d'analyse de documents de MAOS.
Tu analyses les documents de maniere professionnelle et exhaustive.
Tu reponds toujours en francais.
Tu structures tes reponses clairement.
Tu extrais les informations cles: montants, dates, noms, numeros de documents.
Tu donnes des insights business pertinents.`,
        },
        {
          role: 'user',
          content: `${prompt}\n\n--- CONTENU DU DOCUMENT ---\n${text.substring(0, 30000)}`,
        },
      ],
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || 'Analyse impossible';
  } catch (error) {
    console.error('Text analysis error:', error);
    return 'Erreur lors de l\'analyse du texte.';
  }
}

// ============================================================================
// Summary Generation
// ============================================================================

async function generateSummary(analysis: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Genere un resume tres concis (2-3 phrases) de cette analyse. Reponds en francais.',
        },
        {
          role: 'user',
          content: analysis.substring(0, 8000),
        },
      ],
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Resume non disponible.';
  }
}

// ============================================================================
// Key Points Extraction
// ============================================================================

async function extractKeyPoints(analysis: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extrait 3-5 points cles de cette analyse. Reponds UNIQUEMENT avec un JSON array: ["point1", "point2", ...]',
        },
        {
          role: 'user',
          content: analysis.substring(0, 5000),
        },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"points":[]}';
    const parsed = JSON.parse(content);
    return parsed.points || parsed.keyPoints || Object.values(parsed).flat().slice(0, 5);
  } catch (error) {
    console.error('Key points extraction error:', error);
    return ['Analyse complete', 'Points cles identifies'];
  }
}
