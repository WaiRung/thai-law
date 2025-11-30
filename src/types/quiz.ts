/**
 * Types for QuizLaw feature
 * Quiz game inspired by QuizUp - questions from flashcards with 4 choices
 */

/**
 * Represents a quiz question with 4 choices
 */
export interface QuizQuestion {
  id: string;
  question: string;          // Content of the section (without "มาตรา", "วรรค", "อนุ")
  correctAnswer: string;     // The correct answer (e.g., "มาตรา 123")
  choices: string[];         // 4 choices including the correct answer
  type: 'section' | 'paragraph' | 'subsection';  // Type of question
}

/**
 * Quiz game state
 */
export interface QuizGameState {
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  answeredQuestions: Set<string>;
  selectedAnswer: string | null;
  isAnswered: boolean;
  isCorrect: boolean | null;
}

/**
 * Quiz result for a completed quiz
 */
export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
}
