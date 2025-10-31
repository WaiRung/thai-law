export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface CategoryStore {
  id: string;
  nameTh: string;
  nameEn: string;
  icon: string;
  questions: Flashcard[];
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
