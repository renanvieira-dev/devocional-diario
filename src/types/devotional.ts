export type TheologicalLocus = 
  | 'Teologia Própria'
  | 'Cristologia'
  | 'Pneumatologia'
  | 'Soteriologia'
  | 'Antropologia'
  | 'Eclesiologia'
  | 'Escatologia';

export interface ExegesisInsight {
  originalWord: string;
  transliteration: string;
  strongCode?: string;
  morphology: string;
  definition: string;
  exegeticalContext: string;
}

export interface HistoricalNote {
  theologianOrDoc: string;
  era: 'Patrística' | 'Medieval' | 'Reforma' | 'Pós-Reforma' | 'Contemporânea';
  dateEstimate: string;
  work: string;
  quote: string;
  historicalContext: string;
}

export interface CrossReference {
  ref: string;
  explanation: string;
}

export interface PracticalLifeChallenge {
  category: 'Vida Pessoal' | 'Relacionamentos' | 'Trabalho & Rotina';
  title: string;
  challenge: string;
}

export interface DevotionalDay {
  id: string;
  date: string;
  dayOfYear: number;
  title: string;
  theologicalTheme: {
    locus: TheologicalLocus;
    subtitle: string;
  };
  scripture: {
    reference: string;
    version: 'NVT' | 'NAA' | 'ARA' | 'NVI';
    fullText: string;
    keyVerse: string;
  };
  historicalRedemptiveContext: string;
  crossReferences: CrossReference[];
  exegesisInsights: ExegesisInsight[];
  expositionSections: {
    heading: string;
    paragraphs: string[];
  }[];
  confessionalEchoes: {
    confession: string;
    article: string;
    text: string;
  }[];
  historicalNote: HistoricalNote;
  practicalChallenges: PracticalLifeChallenge[];
  meditationQuestions: string[];
  guidedPrayer: string;
}

export type ThemeMode = 'light' | 'sepia' | 'dark';