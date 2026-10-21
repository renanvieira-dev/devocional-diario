export interface CellStudySection {
  heading: string;
  originalTextToRead: string;
  insights: {
    practicalAnalogy: string;
    explanationKey: string;
    groupQuestion: string;
  };
}

export interface CellStudyInsight {
  id: string; // Identificador único
  createdAt: string; // Data de criação
  title: string;
  passageBase: string;
  icebreaker: {
    title: string;
    instructions: string;
    questionToAsk: string;
  };
  introSection: {
    originalTextToRead: string;
    leaderNote: string;
  };
  sections: CellStudySection[];
  conclusionSection: {
    originalTextToRead: string;
    lifeApplicationChallenge: string;
    closingPrayerTopics: string[];
  };
  complementaryPassages: {
    ref: string;
    howItConnects: string;
  }[];
}