import type { HighScore } from "../types/quiz";

/**
 * IndexedDB Database Configuration for High Scores
 */
const DB_NAME = "thai-law-db";
const STORE_NAME = "categories-cache";
const DESCRIPTIONS_STORE_NAME = "descriptions";
const HIGH_SCORES_STORE_NAME = "high-scores";
const DB_VERSION = 3;

/**
 * Thai month abbreviations for date formatting
 */
const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

/**
 * Format date in Thai Buddhist calendar format
 * @param timestamp - Unix timestamp
 * @returns Formatted date string (e.g., "31 ต.ค. 2568")
 */
export function formatThaiDate(timestamp: number): string {
  const date = new Date(timestamp);
  const thaiYear = date.getFullYear() + 543;
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  
  return `${day} ${month} ${thaiYear}`;
}

/**
 * Open IndexedDB database with high scores store
 * @returns Promise with IDBDatabase
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create all object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
        console.log("Created IndexedDB object store:", STORE_NAME);
      }
      
      if (!db.objectStoreNames.contains(DESCRIPTIONS_STORE_NAME)) {
        db.createObjectStore(DESCRIPTIONS_STORE_NAME, { keyPath: "id" });
        console.log("Created IndexedDB object store:", DESCRIPTIONS_STORE_NAME);
      }
      
      if (!db.objectStoreNames.contains(HIGH_SCORES_STORE_NAME)) {
        db.createObjectStore(HIGH_SCORES_STORE_NAME, { keyPath: "categoryId" });
        console.log("Created IndexedDB object store:", HIGH_SCORES_STORE_NAME);
      }
    };
  });
}

/**
 * Save a high score to IndexedDB
 * @param highScore - High score entry to save
 */
export async function saveHighScore(highScore: HighScore): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([HIGH_SCORES_STORE_NAME], "readwrite");
    const store = transaction.objectStore(HIGH_SCORES_STORE_NAME);
    
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
    
    const transaction = db.transaction([HIGH_SCORES_STORE_NAME], "readonly");
    const store = transaction.objectStore(HIGH_SCORES_STORE_NAME);
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
    
    const transaction = db.transaction([HIGH_SCORES_STORE_NAME], "readonly");
    const store = transaction.objectStore(HIGH_SCORES_STORE_NAME);
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
