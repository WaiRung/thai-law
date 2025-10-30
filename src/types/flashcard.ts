export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export interface GameState {
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  completedCards: Set<number>;
}
