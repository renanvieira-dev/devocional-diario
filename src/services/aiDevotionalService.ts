import { GoogleGenAI, Type } from '@google/genai';
import type { DevotionalDay } from '../types/devotional';
import type { CellStudyInsight } from '../types/cellStudy';
import type { SermonInsight } from '../types/sermon';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
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
// 1. DEVOCIONAL DIÁRIO (LINGUAGEM SIMPLES, DIRETA E COM ACENTOS COMPLETOS)
// ---------------------------------------------------------------------------
export async function generateTheologicalStudy(
  passageOrTopic?: string
): Promise<DevotionalDay> {
  const todayStr = new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' });
  
  const prompt = passageOrTopic
    ? `Crie um devocional prático, claro e inspirador sobre: "${passageOrTopic}".`
    : `Crie o devocional de hoje (${todayStr}) baseado em uma passagem bíblica marcante e prática.`;

  const fullPrompt = `${prompt}

DIRETRIZES FUNDAMENTAIS DE LINGUAGEM:
1. ORTOGRAFIA E ACENTUAÇÃO: Escreva em Português do Brasil correto, com TODOS os acentos gráficos devidamente aplicados (á, é, í, ó, ú, â, ê, ô, ã, õ, ç, à). Nunca omita acentos.
2. TOM DE VOZ: Simples, acolhedor, fluido e direto. Escreva como um bom amigo conversando com você, sem termos difíceis, sem academicismo e sem jargões teológicos complicados.
3. FÁCIL COMPREENSÃO: A leitura deve ser leve e clara. O leitor não deve precisar reler para entender a mensagem central.
4. EXPLICAÇÃO PRÁTICA: Explique o que o texto significa para a vida real de hoje, no trabalho, na família e nas decisões diárias.
5. DESAFIOS PRÁTICOS: 3 atitudes simples e realizáveis no dia a dia.`;

  const schemaConfig = {
    systemInstruction:
      'Você é um pastor amigo e comunicador claro. Sua missão é traduzir a Bíblia de forma simples, prática e sem formalismos difíceis, sempre com acentuação impecável em Português do Brasil.',
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
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// 2. ROTEIRO DE CÉLULA (TELEPROMPTER SIMPLES COM ACENTUAÇÃO E ANALOGIAS)
// ---------------------------------------------------------------------------
export async function analyzeCellStudyPdf(file: File): Promise<CellStudyInsight> {
  const base64Data = await fileToBase64(file);

  const prompt = `Você é um líder de célula experiente e descontraído, que fala de forma simples, clara e envolvente.
Analise o PDF anexado e monte um roteiro integrado para facilitar a reunião.

REGRAS DE OURO:
1. ACENTUAÇÃO COMPLETA: Todo o texto gerado DEVE conter todas as palavras devidamente acentuadas em Português do Brasil (palavras como bênção, você, coração, está, são, não).
2. LINGUAGEM CLARA E NATURAL: Escreva em linguagem coloquial, moderna e sem enrolação. Nada de frases compridas ou termos teológicos inacessíveis. Fale com clareza.
3. CONTEÚDO ORIGINAL DO PDF: Mantenha as frases principais do PDF em cada seção para leitura direta aos irmãos.
4. ADICIONAIS DO LÍDER:
   - Exemplo do cotidiano: Uma historinha ou comparação simples da vida moderna (trabalho, celular, trânsito, compras, família) que qualquer pessoa entenda na hora.
   - Pergunta aberta: Uma pergunta leve e direta para puxar conversa na sala sem deixar o clima travado.`;

  const schemaConfig = {
    systemInstruction:
      'Você é um líder de pequenos grupos prático e comunicativo. Escreva sempre em português claro, simples, acessível e 100% acentuado.',
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// 3. PREPARADOR DE SERMÕES (CLARO, OBJETIVO E TOTALMENTE ACENTUADO)
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

  const prompt = `Crie um esboço de pregação claro, prático e inspirador com base em:
${promptCriteria || 'Tema: A Paz que Supera o Medo | Texto: Filipenses 4:6-7'}

DIRETRIZES DE ESTILO:
1. ACENTUAÇÃO E ORTOGRAFIA: Todas as palavras devem ser acentuadas de forma completa e correta no Português do Brasil.
2. LINGUAGEM ACESSÍVEL: Não use palavras difíceis, erudição desnecessária ou termos arcaicos. Fale de forma dinâmica, que prenda a atenção de jovens e adultos com naturalidade.
3. IDEIA CENTRAL: Resuma a mensagem em uma frase simples e impactante que as pessoas consigam memorizar.
4. ILUSTRAÇÕES DO DIA A DIA: Exemplos reais de situações do cotidiano para cada ponto.
5. APELO DIRETO: Um convite claro e prático à mudança de atitude.`;

  const schemaConfig = {
    systemInstruction:
      'Você é um pregador comunicativo e acolhedor. Seu objetivo é falar ao coração das pessoas com palavras simples, sem jargões complexos e com ortografia e acentuação impecáveis.',
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError;
}