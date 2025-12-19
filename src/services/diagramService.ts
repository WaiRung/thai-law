import type { DiagramCache, DiagramCacheMetadata } from "../types/diagram";
import diagramsConfig from "../config/diagrams.json";
import { openDatabase, formatThaiDate, STORE_NAMES } from "./database";

const CACHE_VERSION = "1.0";

/**
 * Cache entry structure stored in IndexedDB
 */
interface DiagramCacheEntry {
  id: string;
  data: DiagramCache[];
  timestamp: number;
  version: string;
  count: number;
  size: number;
}

/**
 * Fetch an image from URL and convert to Base64 data URL
 * @param url - Image URL to fetch
 * @returns Promise with Base64 data URL
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to Base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error);
    throw error;
  }
}

/**
 * Download all diagram images from all categories
 * @returns Promise with array of DiagramCache
 */
export async function downloadDiagramImages(): Promise<DiagramCache[]> {
  const cacheData: DiagramCache[] = [];
  const baseUrl = diagramsConfig.baseUrl;
  
  for (const category of diagramsConfig.diagrams) {
    // Skip categories with no images
    if (!category.images || category.images.length === 0) {
      continue;
    }
    
    const categoryCache: DiagramCache = {
      categoryId: category.categoryId,
      images: [],
    };
    
    // Download each image in the category
    for (const image of category.images) {
      const imageUrl = `${baseUrl}/${category.categoryPath}/${image.filename}`;
      
      try {
        console.log(`Downloading image: ${image.nameTh} (${image.filename})`);
        const base64Data = await fetchImageAsBase64(imageUrl);
        
        categoryCache.images.push({
          filename: image.filename,
          nameTh: image.nameTh,
          nameEn: image.nameEn,
          data: base64Data,
        });
      } catch (error) {
        console.warn(`Failed to download image ${image.filename}, skipping:`, error);
        // Continue with other images even if one fails
      }
    }
    
    // Only add category if at least one image was downloaded
    if (categoryCache.images.length > 0) {
      cacheData.push(categoryCache);
    }
  }
  
  return cacheData;
}

/**
 * Calculate total size of cached images in bytes
 * @param cache - Array of DiagramCache
 * @returns Total size in bytes
 */
function calculateCacheSize(cache: DiagramCache[]): number {
  let totalSize = 0;
  
  for (const category of cache) {
    for (const image of category.images) {
      if (image.data) {
        // Approximate size: Base64 string length * 0.75 (Base64 is ~33% larger than binary)
        totalSize += Math.floor(image.data.length * 0.75);
      }
    }
  }
  
  return totalSize;
}

/**
 * Count total images in cache
 * @param cache - Array of DiagramCache
 * @returns Total number of images
 */
function countTotalImages(cache: DiagramCache[]): number {
  return cache.reduce((total, category) => total + category.images.length, 0);
}

/**
 * Save diagram cache to IndexedDB
 * @param cache - Array of DiagramCache to save
 */
export async function saveDiagramCache(cache: DiagramCache[]): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DIAGRAMS], "readwrite");
    const store = transaction.objectStore(STORE_NAMES.DIAGRAMS);
    
    const cacheEntry: DiagramCacheEntry = {
      id: "diagrams",
      data: cache,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      count: countTotalImages(cache),
      size: calculateCacheSize(cache),
    };
    
    const request = store.put(cacheEntry);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log("Diagram cache saved successfully", {
          count: cacheEntry.count,
          size: `${(cacheEntry.size / 1024 / 1024).toFixed(2)} MB`,
          categories: cache.length,
        });
        resolve();
      };
      
      request.onerror = () => {
        console.error("Failed to save diagram cache:", request.error);
        reject(new Error("Failed to save diagram cache"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error saving diagram cache:", error);
    throw error;
  }
}

/**
 * Retrieve cached diagram image
 * @param categoryId - Category ID
 * @param filename - Image filename
 * @returns Promise with Base64 data URL or null if not found
 */
export async function getCachedDiagramImage(
  categoryId: string,
  filename: string
): Promise<string | null> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DIAGRAMS], "readonly");
    const store = transaction.objectStore(STORE_NAMES.DIAGRAMS);
    const request = store.get("diagrams");
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry = request.result as DiagramCacheEntry | undefined;
        
        if (!cacheEntry) {
          resolve(null);
          return;
        }
        
        // Find the category
        const category = cacheEntry.data.find(cat => cat.categoryId === categoryId);
        if (!category) {
          resolve(null);
          return;
        }
        
        // Find the image
        const image = category.images.find(img => img.filename === filename);
        if (!image || !image.data) {
          resolve(null);
          return;
        }
        
        resolve(image.data);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve cached diagram image:", request.error);
        reject(new Error("Failed to retrieve cached diagram image"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving cached diagram image:", error);
    return null; // Return null on error instead of throwing
  }
}

/**
 * Get diagram cache metadata
 * @returns Promise with cache metadata or null if not found
 */
export async function getDiagramCacheMetadata(): Promise<DiagramCacheMetadata | null> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DIAGRAMS], "readonly");
    const store = transaction.objectStore(STORE_NAMES.DIAGRAMS);
    const request = store.get("diagrams");
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry = request.result as DiagramCacheEntry | undefined;
        
        if (!cacheEntry) {
          resolve(null);
          return;
        }
        
        const metadata: DiagramCacheMetadata = {
          timestamp: cacheEntry.timestamp,
          lastUpdated: formatThaiDate(cacheEntry.timestamp),
          count: cacheEntry.count,
          size: cacheEntry.size,
          version: cacheEntry.version,
        };
        
        resolve(metadata);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve diagram cache metadata:", request.error);
        reject(new Error("Failed to retrieve diagram cache metadata"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving diagram cache metadata:", error);
    return null; // Return null on error instead of throwing
  }
}

/**
 * Clear diagram cache from IndexedDB
 */
export async function clearDiagramCache(): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DIAGRAMS], "readwrite");
    const store = transaction.objectStore(STORE_NAMES.DIAGRAMS);
    
    store.delete("diagrams");
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log("Diagram cache cleared successfully");
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        console.error("Failed to clear diagram cache:", transaction.error);
        db.close();
        reject(new Error("Failed to clear diagram cache"));
      };
    });
  } catch (error) {
    console.error("Error clearing diagram cache:", error);
    throw error;
  }
}
