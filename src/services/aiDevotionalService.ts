import { GoogleGenAI, Type } from '@google/genai';
import type { DevotionalDay } from '../types/devotional';
import type { CellStudyInsight } from '../types/cellStudy';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Modelos Flash com rota de redundância para evitar bloqueios de tráfego (503)
const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

// Converte arquivo PDF local em base64 puro para envio à API Gemini
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

// ---------------------------------------------------------------------------
// 1. GERAÇÃO DO DEVOCIONAL PESSOAL POR IA
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 2. ANÁLISE DE PDF & ROTEIRO INTEGRADO PARA CÉLULA (TELEPROMPTER)
// ---------------------------------------------------------------------------
export async function analyzeCellStudyPdf(file: File): Promise<CellStudyInsight> {
  const base64Data = await fileToBase64(file);

  const prompt = `Você é um pastor e mentor experiente de líderes de células e pequenos grupos.
Analise o PDF anexado com o estudo/esboço e gere um ROTEIRO INTEGRADO DE MINISTRAÇÃO.

OBJETIVO CRÍTICO:
O líder vai usar este roteiro diretamente no celular durante a reunião da célula.
ELE NÃO DEVE PRECISAR ABRIR O PDF EM NENHUM MOMENTO.
Portanto:
1. MANTENHA RIGOROSAMENTE A ESTRUTURA E O TEXTO ORIGINAL DO PDF que o líder precisa ler ou repassar para os irmãos (introdução, versículos, pontos centrais e conclusão).
2. LOGO ABAIXO DE CADA PONTO DE LEITURA DO PDF, insira os "Adicionais do Líder":
   - Uma analogia ou exemplo prático do cotidiano atual (trabalho, família, rotina, tecnologia) perfeitamente coerente para ilustrar aquele ponto.
   - Um insight explicativo pastoral para aprofundar o entendimento.
   - Uma pergunta aberta e dinâmica de engajamento para o líder fazer à célula logo após ler aquele trecho, evitando que a reunião vire um monólogo.`;

  const schemaConfig = {
    systemInstruction:
      'Você é um pastor e professor de homilética pastoral para pequenos grupos. Preserve fielmente o conteúdo do roteiro original e enriqueça cada parte com exemplos práticos.',
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
            instructions: { type: Type.STRING },
            questionToAsk: { type: Type.STRING },
          },
          required: ['title', 'instructions', 'questionToAsk'],
        },
        introSection: {
          type: Type.OBJECT,
          properties: {
            originalTextToRead: { type: Type.STRING },
            leaderNote: { type: Type.STRING },
          },
          required: ['originalTextToRead', 'leaderNote'],
        },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              heading: { type: Type.STRING },
              originalTextToRead: { type: Type.STRING },
              insights: {
                type: Type.OBJECT,
                properties: {
                  practicalAnalogy: { type: Type.STRING },
                  explanationKey: { type: Type.STRING },
                  groupQuestion: { type: Type.STRING },
                },
                required: ['practicalAnalogy', 'explanationKey', 'groupQuestion'],
              },
            },
            required: ['heading', 'originalTextToRead', 'insights'],
          },
        },
        conclusionSection: {
          type: Type.OBJECT,
          properties: {
            originalTextToRead: { type: Type.STRING },
            lifeApplicationChallenge: { type: Type.STRING },
            closingPrayerTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['originalTextToRead', 'lifeApplicationChallenge', 'closingPrayerTopics'],
        },
        complementaryPassages: {
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
      },
      required: [
        'title',
        'passageBase',
        'icebreaker',
        'introSection',
        'sections',
        'conclusionSection',
        'complementaryPassages',
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
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de processamento do PDF no modelo: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: parts,
          config: schemaConfig,
        });

        const parsed = JSON.parse(response.text || '{}') as CellStudyInsight;
        
        // Atribui ID único e data para salvar na biblioteca
        parsed.id = parsed.id || `cell_${Date.now()}`;
        parsed.createdAt = parsed.createdAt || new Date().toISOString().split('T')[0];

        console.log(`Roteiro de célula gerado com sucesso pelo modelo: ${modelName}`);
        return parsed;
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa ${attempt} no modelo ${modelName} falhou:`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError;
}