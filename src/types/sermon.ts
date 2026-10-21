export interface SermonPoint {
  heading: string; // Título do ponto homilético
  biblicalSupport: string; // Versículo e breve explicação exegética
  contemporaryAnalogy: string; // Ilustração / analogia prática do cotidiano
  pastoralApplication: string; // Como a igreja aplica isso no dia a dia
}

export interface SermonInsight {
  id: string;
  createdAt: string;
  title: string;
  theme: string;
  biblicalText: string;
  centralProposition: string; // Ideia central (Grande Ideia do Sermão)
  introduction: {
    hook: string; // Gancho inicial para prender a atenção
    context: string; // Contextualização do problema humano / necessidade
    transitionToText: string;
  };
  points: SermonPoint[];
  conclusion: {
    recap: string;
    pastoralAppeal: string; // Apelo / Chamado à resposta de fé
    closingPrayerDirection: string;
  };
  complementaryPassages: {
    ref: string;
    purpose: string;
  }[];
}