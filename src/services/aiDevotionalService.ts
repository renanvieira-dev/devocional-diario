import { GoogleGenAI, Type } from '@google/genai';
import type { DevotionalDay } from '../types/devotional';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Modelos Flash alternativos e independentes da sua chave
const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

export async function generateTheologicalStudy(
  passageOrTopic?: string
): Promise<DevotionalDay> {
  const todayStr = new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' });
  
  const prompt = passageOrTopic
    ? `Gera um estudo bíblico devocional aprofundado, denso e estruturado sobre: "${passageOrTopic}".`
    : `Gera o devocional teológico aprofundado de hoje (${todayStr}). Escolhe uma passagem bíblica canónica relevante (alternando Antigo e Novo Testamento).`;

  const fullPrompt = `${prompt}
Diretrizes:
- Tom: Contemporâneo, claro e teologicamente rigoroso.
- Exegese: 1 a 2 termos em grego/hebraico com morfologia e aplicação.
- Exposição: 2 a 3 secções com boa densidade bíblica.
- Credos e História: Cita 1 confissão histórica e 1 teólogo clássico.
- Desafios Práticos: Exatamente 3 ações objetivas ('Vida Pessoal', 'Relacionamentos', 'Trabalho & Rotina').
- Oração: Sincera e pastoral.`;

  const schemaConfig = {
    systemInstruction:
      'És um professor e teólogo bíblico. Produz estudos fiéis, profundos e sem superficialidade em formato JSON estruturado.',
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        date: { type: Type.STRING },
        dayOfYear: { type: Type.INTEGER },
        title: { type: Type.STRING },
        theologicalTheme: {
          type: Type.OBJECT,
          properties: {
            locus: { type: Type.STRING },
            subtitle: { type: Type.STRING },
          },
          required: ['locus', 'subtitle'],
        },
        scripture: {
          type: Type.OBJECT,
          properties: {
            reference: { type: Type.STRING },
            version: { type: Type.STRING },
            fullText: { type: Type.STRING },
            keyVerse: { type: Type.STRING },
          },
          required: ['reference', 'version', 'fullText', 'keyVerse'],
        },
        historicalRedemptiveContext: { type: Type.STRING },
        crossReferences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ref: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['ref', 'explanation'],
          },
        },
        exegesisInsights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              originalWord: { type: Type.STRING },
              transliteration: { type: Type.STRING },
              morphology: { type: Type.STRING },
              definition: { type: Type.STRING },
              exegeticalContext: { type: Type.STRING },
            },
            required: [
              'originalWord',
              'transliteration',
              'morphology',
              'definition',
              'exegeticalContext',
            ],
          },
        },
        expositionSections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              heading: { type: Type.STRING },
              paragraphs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['heading', 'paragraphs'],
          },
        },
        confessionalEchoes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              confession: { type: Type.STRING },
              article: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ['confession', 'article', 'text'],
          },
        },
        historicalNote: {
          type: Type.OBJECT,
          properties: {
            theologianOrDoc: { type: Type.STRING },
            era: { type: Type.STRING },
            dateEstimate: { type: Type.STRING },
            work: { type: Type.STRING },
            quote: { type: Type.STRING },
            historicalContext: { type: Type.STRING },
          },
          required: [
            'theologianOrDoc',
            'era',
            'dateEstimate',
            'work',
            'quote',
            'historicalContext',
          ],
        },
        practicalChallenges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              challenge: { type: Type.STRING },
            },
            required: ['category', 'title', 'challenge'],
          },
        },
        meditationQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        guidedPrayer: { type: Type.STRING },
      },
      required: [
        'id',
        'date',
        'dayOfYear',
        'title',
        'theologicalTheme',
        'scripture',
        'historicalRedemptiveContext',
        'crossReferences',
        'exegesisInsights',
        'expositionSections',
        'confessionalEchoes',
        'historicalNote',
        'practicalChallenges',
        'meditationQuestions',
        'guidedPrayer',
      ],
    },
  };

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Tentativa ${attempt} com o modelo: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
          config: schemaConfig,
        });

        const parsed = JSON.parse(response.text || '{}');
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayNumber = Math.floor(
          (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
        );

        parsed.id = parsed.id || `dev-${Date.now()}`;
        parsed.date = parsed.date || now.toISOString().split('T')[0];
        parsed.dayOfYear = parsed.dayOfYear || dayNumber;

        console.log(`Estudo gerado com sucesso pelo modelo: ${modelName}`);
        return parsed as DevotionalDay;
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa ${attempt} no modelo ${modelName} falhou:`, err?.message || err);
        // Aguarda 1,5 segundos antes da próxima tentativa para contornar picos de tráfego (503)
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError;
}