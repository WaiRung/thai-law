/**
 * Shared IndexedDB Database Configuration
 * Single source of truth for database schema and version
 */

export const DB_NAME = "thai-law-db";
export const DB_VERSION = 3;

// Object store names
export const STORE_NAMES = {
  CATEGORIES: "categories-cache",
  DESCRIPTIONS: "descriptions",
  HIGH_SCORES: "high-scores",
} as const;

/**
 * Thai month abbreviations for date formatting
 */
export const THAI_MONTHS = [
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
 * Open IndexedDB database with all object stores
 * @returns Promise with IDBDatabase
 */
export function openDatabase(): Promise<IDBDatabase> {
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
      
      // Create categories cache object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.CATEGORIES)) {
        db.createObjectStore(STORE_NAMES.CATEGORIES, { keyPath: "id" });
        console.log("Created IndexedDB object store:", STORE_NAMES.CATEGORIES);
      }
      
      // Create descriptions object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.DESCRIPTIONS)) {
        db.createObjectStore(STORE_NAMES.DESCRIPTIONS, { keyPath: "id" });
        console.log("Created IndexedDB object store:", STORE_NAMES.DESCRIPTIONS);
      }
      
      // Create high scores object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.HIGH_SCORES)) {
        db.createObjectStore(STORE_NAMES.HIGH_SCORES, { keyPath: "categoryId" });
        console.log("Created IndexedDB object store:", STORE_NAMES.HIGH_SCORES);
      }
    };
  });
}
