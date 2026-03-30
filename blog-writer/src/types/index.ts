export interface Topic {
  title: string;
  reason: string;
  angle: string;
  keywords: string[];
}

export interface Section {
  id: string;
  heading: string;
  directAnswer: string;
  body: string;
  keyPoint: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface SEO {
  metaTitle: string;
  metaDesc: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  geoTips: string[];
}

export interface Visual {
  section: string;
  description: string;
  prompt: string;
}

export interface Article {
  title: string;
  intro: string;
  sections: Section[];
  outro: string;
  faq: FAQ[];
  seo: SEO;
  visuals: Visual[];
}

export type Tone = "professional" | "friendly" | "challenging";
export type Reader = "hrd" | "clo" | "hrPlanner" | "eduOperator";
export type CharLength = 800 | 1500 | 2500;
export type SectionCount = 3 | 4 | 5;

export interface AppState {
  currentStep: 1 | 2 | 3;
  suggestedTopics: Topic[] | null;
  isLoadingTopics: boolean;
  selectedTopic: Topic | null;
  directKeyword: string;
  tone: Tone;
  charLength: CharLength;
  reader: Reader;
  sectionCount: SectionCount;
  isGenerating: boolean;
  regeneratingId: string | null;
  streamingText: string;
  error: string | null;
  article: Article | null;
  activeTab: "article" | "seo" | "visual";
}
