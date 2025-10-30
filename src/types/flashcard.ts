export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category?: string;
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
  completedCards: Set<number>;
}
