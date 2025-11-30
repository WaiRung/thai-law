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
  timeBonus: number;        // Total time bonus earned
  totalScore: number;       // Total score including time bonus
  maxScore: number;         // Maximum possible score (base + time bonus for all questions)
}

/**
 * Time settings for quiz countdown
 */
export interface QuizTimeSettings {
  baseTimePerQuestion: number;      // Base time in seconds per question
  timePerCharacter: number;         // Additional time per character in question
  maxTimePerQuestion: number;       // Maximum time allowed per question
  minTimePerQuestion: number;       // Minimum time per question
}

/**
 * Score calculation for a single answer
 */
export interface QuizAnswerScore {
  baseScore: number;           // Base score for correct answer (1 point)
  timeBonus: number;           // Bonus based on remaining time
  totalPoints: number;         // Total points for this answer
}
