/**
 * Score Service
 * Handles countdown time calculation and time-based scoring
 */

import type { QuizTimeSettings, QuizAnswerScore } from "../types/quiz";

/**
 * Constants
 */
const SECONDS_PER_MINUTE = 60;
const DECIMAL_PRECISION = 100; // For rounding to 2 decimal places

/**
 * Default time settings for the quiz
 */
export const DEFAULT_TIME_SETTINGS: QuizTimeSettings = {
  baseTimePerQuestion: 10,      // 10 seconds base time
  timePerCharacter: 0.05,       // 0.05 seconds per character
  maxTimePerQuestion: 60,       // Maximum 60 seconds per question
  minTimePerQuestion: 10,       // Minimum 10 seconds per question
};

/**
 * Round a number to two decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * DECIMAL_PRECISION) / DECIMAL_PRECISION;
}

/**
 * Calculate countdown time for a question based on its length
 * @param questionText - The text of the question
 * @param settings - Optional time settings (defaults to DEFAULT_TIME_SETTINGS)
 * @returns Time in seconds for the countdown
 */
export function calculateCountdownTime(
  questionText: string,
  settings: QuizTimeSettings = DEFAULT_TIME_SETTINGS
): number {
  const characterCount = questionText.length;
  
  // Calculate time: base time + time per character
  const calculatedTime = settings.baseTimePerQuestion + 
    (characterCount * settings.timePerCharacter);
  
  // Clamp between min and max
  const clampedTime = Math.min(
    settings.maxTimePerQuestion,
    Math.max(settings.minTimePerQuestion, calculatedTime)
  );
  
  // Round to nearest second
  return Math.round(clampedTime);
}

/**
 * Calculate score for an answer based on remaining time
 * @param isCorrect - Whether the answer was correct
 * @param remainingTime - Remaining time in seconds when answer was given
 * @param totalTime - Total time allocated for the question
 * @returns Score breakdown for the answer
 */
export function calculateAnswerScore(
  isCorrect: boolean,
  remainingTime: number,
  totalTime: number
): QuizAnswerScore {
  if (!isCorrect) {
    return {
      baseScore: 0,
      timeBonus: 0,
      totalPoints: 0,
    };
  }

  // Base score for correct answer
  const baseScore = 1;

  // Time bonus: up to 100% bonus based on remaining time percentage
  // If answered immediately (100% time remaining), get full bonus
  // If answered at the last second, get minimal bonus
  const timePercentage = Math.max(0, remainingTime / totalTime);
  
  // Time bonus: 0 to 1 point based on speed
  // Fast answer (>50% time remaining): higher bonus
  // Slow answer (<50% time remaining): lower bonus
  const timeBonus = roundToTwoDecimals(timePercentage);

  return {
    baseScore,
    timeBonus,
    totalPoints: baseScore + timeBonus,
  };
}

/**
 * Format time for display (seconds to mm:ss or just seconds)
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  
  if (seconds >= SECONDS_PER_MINUTE) {
    const mins = Math.floor(seconds / SECONDS_PER_MINUTE);
    const secs = Math.floor(seconds % SECONDS_PER_MINUTE);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  
  return `${Math.floor(seconds)}`;
}
