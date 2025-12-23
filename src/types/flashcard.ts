export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  title?: string; // Optional title for whole sections from complex format
  dataSourceIndex?: number; // Optional: Track which data source this flashcard came from (for categories with multiple data sources)
}

export interface DataSource {
  apiFilename: string;
  filterFilename: string;
  descriptionApiPath: string;
  nameTh?: string; // Optional display name for the data source
  nameEn?: string; // Optional display name for the data source
}

export interface CategoryStore {
  id: string;
  nameTh: string;
  nameEn: string;
  icon: string;
  questions: Flashcard[];
  apiFilename?: string; // Optional: Used for API filename mapping (single source)
  filterFilename?: string; // Optional: Used for filter filename (single source)
  descriptionApiPath?: string; // Optional: Used for description path (single source)
  dataSources?: DataSource[]; // Optional: Used for multiple data sources
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
