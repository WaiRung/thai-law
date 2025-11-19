export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  title?: string; // Optional title for whole sections from complex format
}

export interface CategoryStore {
  id: string;
  nameTh: string;
  nameEn: string;
  icon: string;
  questions: Flashcard[];
  apiFilename?: string; // Optional: Used for API filename mapping
}

export interface GameState {
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  completedCards: Set<string>;
}

export interface CacheMetadata {
  timestamp: number;
  lastUpdated: string; // formatted date
  count: number;
  version: string;
}

export interface QuestionFilter {
  categoryId: string;
  allowedQuestionIds: string[];
}
