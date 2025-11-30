import type { HighScore } from "../types/quiz";
import { openDatabase, formatThaiDate, STORE_NAMES } from "./database";

// Re-export formatThaiDate for convenience
export { formatThaiDate };

/**
 * Save a high score to IndexedDB
 * @param highScore - High score entry to save
 */
export async function saveHighScore(highScore: HighScore): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.HIGH_SCORES], "readwrite");
    const store = transaction.objectStore(STORE_NAMES.HIGH_SCORES);
    
    const request = store.put(highScore);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log("High score saved successfully", {
          categoryId: highScore.categoryId,
          score: highScore.score,
          percentage: highScore.percentage,
        });
        resolve();
      };
      
      request.onerror = () => {
        console.error("Failed to save high score:", request.error);
        reject(new Error("Failed to save high score"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error saving high score:", error);
    throw error;
  }
}

/**
 * Get high score for a specific category
 * @param categoryId - Category ID
 * @returns Promise with high score or null if not found
 */
export async function getHighScore(categoryId: string): Promise<HighScore | null> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.HIGH_SCORES], "readonly");
    const store = transaction.objectStore(STORE_NAMES.HIGH_SCORES);
    const request = store.get(categoryId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const highScore = request.result as HighScore | undefined;
        
        if (!highScore) {
          resolve(null);
          return;
        }
        
        resolve(highScore);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve high score:", request.error);
        reject(new Error("Failed to retrieve high score"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving high score:", error);
    return null;
  }
}

/**
 * Get all high scores
 * @returns Promise with map of category ID to high score
 */
export async function getAllHighScores(): Promise<Map<string, HighScore>> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.HIGH_SCORES], "readonly");
    const store = transaction.objectStore(STORE_NAMES.HIGH_SCORES);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const highScores = request.result as HighScore[];
        const highScoreMap = new Map<string, HighScore>();
        
        for (const score of highScores) {
          highScoreMap.set(score.categoryId, score);
        }
        
        resolve(highScoreMap);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve all high scores:", request.error);
        reject(new Error("Failed to retrieve all high scores"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving all high scores:", error);
    return new Map();
  }
}

/**
 * Check if a score is a new high score and save it if so
 * @param categoryId - Category ID
 * @param score - Number of correct answers
 * @param percentage - Percentage score
 * @param totalQuestions - Total questions in the quiz
 * @returns Promise with boolean indicating if it was a new high score
 */
export async function checkAndSaveHighScore(
  categoryId: string,
  score: number,
  percentage: number,
  totalQuestions: number
): Promise<boolean> {
  try {
    const existingHighScore = await getHighScore(categoryId);
    
    // Check if this is a new high score
    // A new high score is achieved if:
    // 1. No existing high score exists, OR
    // 2. The new percentage is higher than the existing one
    const isNewHighScore = !existingHighScore || percentage > existingHighScore.percentage;
    
    if (isNewHighScore) {
      const newHighScore: HighScore = {
        categoryId,
        score,
        percentage,
        totalQuestions,
        achievedAt: Date.now(),
      };
      
      await saveHighScore(newHighScore);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking/saving high score:", error);
    return false;
  }
}
