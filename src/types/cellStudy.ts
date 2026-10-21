import type { ReactNode } from "react";

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
  outlinePoints: any;
  discussionQuestions: any;
  crossReferences: any;
  lifeChallenge: ReactNode;
  closingPrayerTopics: any;
  mainIdea: ReactNode;
  title: string;
  passageBase: string;
  icebreaker: {
    description: ReactNode;
    question: ReactNode;
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