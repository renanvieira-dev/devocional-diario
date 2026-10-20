export interface CellStudyInsight {
  title: string;
  passageBase: string;
  icebreaker: {
    title: string;
    description: string;
    question: string;
  };
  mainIdea: string;
  outlinePoints: {
    point: string;
    explanation: string;
    practicalAnalogy: string;
  }[];
  discussionQuestions: string[];
  crossReferences: {
    ref: string;
    howItConnects: string;
  }[];
  lifeChallenge: string;
  closingPrayerTopics: string[];
}