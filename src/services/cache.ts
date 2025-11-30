import type { CategoryStore, CacheMetadata } from "../types/flashcard";
import type { DescriptionCache } from "../types/description";
import { openDatabase, formatThaiDate, STORE_NAMES } from "./database";

const CACHE_VERSION = "1.0";

/**
 * Cache entry structure stored in IndexedDB
 */
interface CacheEntry {
  id: string;
  data: CategoryStore[];
  timestamp: number;
  version: string;
  count: number;
}

/**
 * Count total questions across all categories
 * @param categories - Array of category stores
 * @returns Total number of questions
 */
function countTotalQuestions(categories: CategoryStore[]): number {
  return categories.reduce((total, category) => total + category.questions.length, 0);
}

/**
 * Save categories to IndexedDB cache
 * @param categories - Array of category stores to cache
 */
export async function saveCategoriesCache(categories: CategoryStore[]): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.CATEGORIES], "readwrite");
    const store = transaction.objectStore(STORE_NAMES.CATEGORIES);
    
    const cacheEntry: CacheEntry = {
      id: "categories",
      data: categories,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      count: countTotalQuestions(categories),
    };
    
    const request = store.put(cacheEntry);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log("Categories cached successfully", {
          count: cacheEntry.count,
          categories: categories.length,
        });
        resolve();
      };
      
      request.onerror = () => {
        console.error("Failed to cache categories:", request.error);
        reject(new Error("Failed to save cache"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error saving categories cache:", error);
    throw error;
  }
}

/**
 * Retrieve cached categories from IndexedDB
 * @returns Promise with cached categories or null if not found
 */
export async function getCategoriesCache(): Promise<CategoryStore[] | null> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.CATEGORIES], "readonly");
    const store = transaction.objectStore(STORE_NAMES.CATEGORIES);
    const request = store.get("categories");
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry = request.result as CacheEntry | undefined;
        
        if (!cacheEntry) {
          console.log("No cached categories found");
          resolve(null);
          return;
        }
        
        console.log("Loaded categories from cache", {
          count: cacheEntry.count,
          categories: cacheEntry.data.length,
          timestamp: new Date(cacheEntry.timestamp).toISOString(),
        });
        
        resolve(cacheEntry.data);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve cache:", request.error);
        reject(new Error("Failed to retrieve cache"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving categories cache:", error);
    return null; // Return null on error instead of throwing
  }
}

/**
 * Get cache metadata
 * @returns Promise with cache metadata or null if not found
 */
export async function getCacheMetadata(): Promise<CacheMetadata | null> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.CATEGORIES], "readonly");
    const store = transaction.objectStore(STORE_NAMES.CATEGORIES);
    const request = store.get("categories");
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry = request.result as CacheEntry | undefined;
        
        if (!cacheEntry) {
          resolve(null);
          return;
        }
        
        const metadata: CacheMetadata = {
          timestamp: cacheEntry.timestamp,
          lastUpdated: formatThaiDate(cacheEntry.timestamp),
          count: cacheEntry.count,
          version: cacheEntry.version,
        };
        
        resolve(metadata);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve cache metadata:", request.error);
        reject(new Error("Failed to retrieve cache metadata"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving cache metadata:", error);
    return null; // Return null on error instead of throwing
  }
}

/**
 * Clear all cached data from IndexedDB
 */
export async function clearCache(): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.CATEGORIES, STORE_NAMES.DESCRIPTIONS], "readwrite");
    const categoriesStore = transaction.objectStore(STORE_NAMES.CATEGORIES);
    const descriptionsStore = transaction.objectStore(STORE_NAMES.DESCRIPTIONS);
    
    categoriesStore.delete("categories");
    descriptionsStore.delete("descriptions");
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log("Cache cleared successfully");
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        console.error("Failed to clear cache:", transaction.error);
        db.close();
        reject(new Error("Failed to clear cache"));
      };
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    throw error;
  }
}

/**
 * Check if cache exists and is still valid
 * @param maxAgeInDays - Maximum age of cache in days (default: 7)
 * @returns Promise with boolean indicating if cache is valid
 */
export async function isCacheValid(maxAgeInDays: number = 7): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata();
    
    if (!metadata) {
      return false;
    }
    
    const now = Date.now();
    const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000;
    const age = now - metadata.timestamp;
    
    const isValid = age < maxAgeMs;
    
    console.log("Cache validity check", {
      isValid,
      age: Math.round(age / (1000 * 60 * 60 * 24) * 10) / 10 + " days",
      maxAge: maxAgeInDays + " days",
    });
    
    return isValid;
  } catch (error) {
    console.error("Error checking cache validity:", error);
    return false;
  }
}

/**
 * Descriptions cache entry structure
 */
interface DescriptionsCacheEntry {
  id: string;
  data: DescriptionCache;
  timestamp: number;
  version: string;
}

/**
 * Save descriptions to IndexedDB cache
 * @param descriptions - DescriptionCache to save
 */
export async function saveDescriptionsCache(descriptions: DescriptionCache): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DESCRIPTIONS], "readwrite");
    const store = transaction.objectStore(STORE_NAMES.DESCRIPTIONS);
    
    const cacheEntry: DescriptionsCacheEntry = {
      id: "descriptions",
      data: descriptions,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    
    const request = store.put(cacheEntry);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log("Descriptions cached successfully", {
          count: Object.keys(descriptions).length,
        });
        resolve();
      };
      
      request.onerror = () => {
        console.error("Failed to cache descriptions:", request.error);
        reject(new Error("Failed to save descriptions cache"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error saving descriptions cache:", error);
    throw error;
  }
}

/**
 * Retrieve cached descriptions from IndexedDB
 * @returns Promise with cached descriptions or empty object if not found
 */
export async function getDescriptionsCache(): Promise<DescriptionCache> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DESCRIPTIONS], "readonly");
    const store = transaction.objectStore(STORE_NAMES.DESCRIPTIONS);
    const request = store.get("descriptions");
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry = request.result as DescriptionsCacheEntry | undefined;
        
        if (!cacheEntry) {
          console.log("No cached descriptions found");
          resolve({});
          return;
        }
        
        console.log("Loaded descriptions from cache", {
          count: Object.keys(cacheEntry.data).length,
          timestamp: new Date(cacheEntry.timestamp).toISOString(),
        });
        
        resolve(cacheEntry.data);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve descriptions cache:", request.error);
        reject(new Error("Failed to retrieve descriptions cache"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving descriptions cache:", error);
    return {}; // Return empty object on error instead of throwing
  }
}
