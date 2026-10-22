import { GoogleGenAI, Type } from '@google/genai';
import type { DevotionalDay } from '../types/devotional';
import type { CellStudyInsight } from '../types/cellStudy';
import type { SermonInsight } from '../types/sermon';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Modelos oficiais estáveis suportados pelo SDK @google/genai
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
];

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
// 1. DEVOCIONAL DIÁRIO / PESQUISA CUSTOMIZADA
// ---------------------------------------------------------------------------
export async function generateTheologicalStudy(
  passageOrTopic?: string
): Promise<DevotionalDay> {
  const todayStr = new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' });
  
  const prompt = passageOrTopic && passageOrTopic.trim().length > 0
    ? `Crie um estudo bíblico devocional inspirador, claro e prático com foco específico em: "${passageOrTopic.trim()}". Escolha a melhor passagem bíblica canônica que responda ou embase esse tema.`
    : `Crie o devocional de hoje (${todayStr}) baseado em uma passagem bíblica canônica edificante e prática.`;

  const fullPrompt = `${prompt}

DIRETRIZES DE ESTILO E LINGUAGEM:
1. ORTOGRAFIA E ACENTUAÇÃO: Escreva em Português do Brasil com acentuação rigorosamente correta e completa em todas as palavras (como bênção, você, coração, está, são, não).
2. LINGUAGEM CLARA E ACESSÍVEL: Linguagem fluida, direta e conversacional. Sem jargões acadêmicos herméticos ou palavras difíceis que cansam a leitura.
3. CONEXÃO PRÁTICA: Explique como essa verdade bíblica transforma o dia a dia na família, trabalho e pensamentos.
4. DESAFIOS PRÁTICOS: 3 passos objetivos e simples para aplicar ainda hoje.`;

  const schemaConfig = {
    systemInstruction:
      'Você é um pastor e professor bíblico próximo e comunicativo. Traduza verdades bíblicas de forma acessível, sem vocabulário rebuscado, com acentuação impecável em Português do Brasil.',
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
    try {
      console.log(`Gerando estudo com o modelo: ${modelName}...`);
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

      return parsed as DevotionalDay;
    } catch (err: any) {
      console.warn(`Tentativa no modelo ${modelName} falhou:`, err?.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// 2. ROTEIRO DE CÉLULA (TELEPROMPTER INTEGRADO)
// ---------------------------------------------------------------------------
export async function analyzeCellStudyPdf(file: File): Promise<CellStudyInsight> {
  const base64Data = await fileToBase64(file);

  const prompt = `Você é um líder de célula comunicativo e prático.
Analise o PDF anexado e monte um roteiro integrado de ministração para facilitar a reunião.

DIRETRIZES:
1. ACENTUAÇÃO E ORTOGRAFIA: Todas as palavras devem ser acentuadas de forma correta e completa em Português do Brasil.
2. LINGUAGEM NATURAL E DIRETA: Linguagem leve, sem afetação ou termos difíceis.
3. CONTEÚDO ORIGINAL DO PDF: Preserve as passagens e pontos que o líder lerá para o grupo.
4. ADICIONAIS DO LÍDER:
   - Exemplo do cotidiano: Analogia simples e atual para cada ponto.
   - Pergunta aberta: Pergunta que estimule diálogo na roda de conversa.`;

  const schemaConfig = {
    systemInstruction:
      'Você é um líder pastoral experiente em pequenos grupos. Escreva sempre em português claro, direto e 100% acentuado.',
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
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: parts,
        config: schemaConfig,
      });

      const parsed = JSON.parse(response.text || '{}') as CellStudyInsight;
      parsed.id = parsed.id || `cell_${Date.now()}`;
      parsed.createdAt = parsed.createdAt || new Date().toISOString().split('T')[0];
      return parsed;
    } catch (err: any) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// 3. PREPARADOR DE SERMÕES
// ---------------------------------------------------------------------------
export async function generateSermonOutline(
  themeOrTopic?: string,
  biblicalPassage?: string
): Promise<SermonInsight> {
  const promptCriteria = [
    themeOrTopic ? `Tema da Mensagem: "${themeOrTopic}"` : null,
    biblicalPassage ? `Texto Bíblico: "${biblicalPassage}"` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  const prompt = `Crie um esboço homilético prático, claro e edificante com base em:
${promptCriteria || 'Tema: A Paz de Deus | Texto: Filipenses 4:6-7'}

DIRETRIZES:
1. ACENTUAÇÃO COMPLETA: Português do Brasil perfeitamente acentuado.
2. LINGUAGEM ACESSÍVEL: Clara, cativante e sem arcaísmos.
3. IDEIA CENTRAL: Frase forte e memorável.
4. ILUSTRAÇÕES: Comparações práticas do dia a dia para cada tópico.
5. APELO: Convite direto e prático à resposta pessoal.`;

  const schemaConfig = {
    systemInstruction:
      'Você é um comunicador pastoral acolhedor. Fale com clareza e autoridade bíblica sem usar erudição vazia ou termos rebuscados.',
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        theme: { type: Type.STRING },
        biblicalText: { type: Type.STRING },
        centralProposition: { type: Type.STRING },
        introduction: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            context: { type: Type.STRING },
            transitionToText: { type: Type.STRING },
          },
          required: ['hook', 'context', 'transitionToText'],
        },
        points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              heading: { type: Type.STRING },
              biblicalSupport: { type: Type.STRING },
              contemporaryAnalogy: { type: Type.STRING },
              pastoralApplication: { type: Type.STRING },
            },
            required: [
              'heading',
              'biblicalSupport',
              'contemporaryAnalogy',
              'pastoralApplication',
            ],
          },
        },
        conclusion: {
          type: Type.OBJECT,
          properties: {
            recap: { type: Type.STRING },
            pastoralAppeal: { type: Type.STRING },
            closingPrayerDirection: { type: Type.STRING },
          },
          required: ['recap', 'pastoralAppeal', 'closingPrayerDirection'],
        },
        complementaryPassages: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ref: { type: Type.STRING },
              purpose: { type: Type.STRING },
            },
            required: ['ref', 'purpose'],
          },
        },
      },
      required: [
        'title',
        'theme',
        'biblicalText',
        'centralProposition',
        'introduction',
        'points',
        'conclusion',
        'complementaryPassages',
      ],
    },
  };

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: schemaConfig,
      });

      const parsed = JSON.parse(response.text || '{}') as SermonInsight;
      parsed.id = parsed.id || `sermon_${Date.now()}`;
      parsed.createdAt = parsed.createdAt || new Date().toISOString().split('T')[0];
      return parsed;
    } catch (err: any) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  throw lastError;
}