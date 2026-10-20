import { GoogleGenAI, Type } from '@google/genai';
import type { DevotionalDay } from '../types/devotional';
import type { CellStudyInsight } from '../types/cellStudy';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function analyzeCellStudyPdf(file: File): Promise<CellStudyInsight> {
  const base64Data = await fileToBase64(file);

  const prompt = `És um pastor e mentor experiente em liderança de pequenos grupos e células.
Analisa o PDF anexado com o estudo/esboço e gera um GUIA COMPLETO DE MINISTRAÇÃO PARA CÉLULA.

Diretrizes:
- Extrai o texto bíblico principal e o tema central do documento.
- Cria um Quebra-Gelo inteligente que introduza o tema de forma leve e participativa.
- Divide a mensagem em tópicos claros e objetivos (máximo 15 a 20 minutos de exposição).
- Para CADA tópico, fornece uma analogia/exemplo prático do quotidiano (trabalho, rotina, tecnologia, relacionamentos) que torne o conceito fácil de compreender.
- Fornece 3 a 4 perguntas abertas que promovam diálogo genuíno no grupo.
- Adiciona referências bíblicas complementares que enriqueçam o tema.
- Um desafio prático semanal para a célula e direcionamento de oração.`;

  const schemaConfig = {
    systemInstruction:
      'És um especialista em homilética pastoral e facilitação de células e pequenos grupos.',
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        passageBase: { type: Type.STRING },
        icebreaker: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            question: { type: Type.STRING },
          },
          required: ['title', 'description', 'question'],
        },
        mainIdea: { type: Type.STRING },
        outlinePoints: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              point: { type: Type.STRING },
              explanation: { type: Type.STRING },
              practicalAnalogy: { type: Type.STRING },
            },
            required: ['point', 'explanation', 'practicalAnalogy'],
          },
        },
        discussionQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        crossReferences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ref: { type: Type.STRING },
              howItConnects: { type: Type.STRING },
            },
            required: ['ref', 'howItConnects'],
          },
        },
        lifeChallenge: { type: Type.STRING },
        closingPrayerTopics: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        'title',
        'passageBase',
        'icebreaker',
        'mainIdea',
        'outlinePoints',
        'discussionQuestions',
        'crossReferences',
        'lifeChallenge',
        'closingPrayerTopics',
      ],
    },
  };

  const parts = [
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data,
      },
    },
    { text: prompt },
  ];

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`A processar PDF de célula com o modelo: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: parts,
        config: schemaConfig,
      });

      return JSON.parse(response.text || '{}') as CellStudyInsight;
    } catch (err: any) {
      console.warn(`Tentativa no modelo ${modelName} falhou:`, err?.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  throw lastError;
}