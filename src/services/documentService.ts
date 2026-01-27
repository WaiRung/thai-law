import type { DocumentCache, DocumentCacheMetadata, DocumentCategory } from "../types/document";
import documentsConfig from "../config/documents.json";
import { openDatabase, formatThaiDate, STORE_NAMES } from "./database";

const CACHE_VERSION = "1.0";

// Type assertion for the config
const typedDocumentsConfig = documentsConfig as {
  baseUrl: string;
  documents: DocumentCategory[];
};

/**
 * Cache entry structure stored in IndexedDB
 */
interface DocumentCacheEntry {
  id: string;
  data: DocumentCache[];
  timestamp: number;
  version: string;
  count: number;
  size: number;
}

/**
 * Fetch a document from URL and convert to Base64 data URL
 * @param url - Document URL to fetch
 * @returns Promise with Base64 data URL
 */
export async function fetchDocumentAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert document to Base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error fetching document from ${url}:`, error);
    throw error;
  }
}

/**
 * Download all documents from all categories
 * @returns Promise with array of DocumentCache
 */
export async function downloadDocuments(): Promise<DocumentCache[]> {
  const cacheData: DocumentCache[] = [];
  const baseUrl = typedDocumentsConfig.baseUrl;
  
  for (const category of typedDocumentsConfig.documents) {
    // Skip categories with no files
    if (!category.files || category.files.length === 0) {
      continue;
    }
    
    const categoryCache: DocumentCache = {
      categoryId: category.categoryId,
      files: [],
    };
    
    // Download each document in the category
    for (const file of category.files) {
      // URL-encode the filename to handle Thai characters and special characters
      const encodedFilename = encodeURIComponent(file.filename);
      const fileUrl = `${baseUrl}/${category.categoryPath}/${encodedFilename}`;
      
      try {
        console.log(`Downloading document: ${file.nameTh} (${file.filename})`);
        const base64Data = await fetchDocumentAsBase64(fileUrl);
        
        categoryCache.files.push({
          filename: file.filename,
          nameTh: file.nameTh,
          nameEn: file.nameEn,
          data: base64Data,
        });
      } catch (error) {
        console.warn(`Failed to download document ${file.filename}, skipping:`, error);
        // Continue with other documents even if one fails
      }
    }
    
    // Only add category if at least one document was downloaded
    if (categoryCache.files.length > 0) {
      cacheData.push(categoryCache);
    }
  }
  
  return cacheData;
}

/**
 * Calculate total size of cached documents in bytes
 * @param cache - Array of DocumentCache
 * @returns Total size in bytes (approximate original binary size)
 */
function calculateCacheSize(cache: DocumentCache[]): number {
  let totalSize = 0;
  
  for (const category of cache) {
    for (const file of category.files) {
      if (file.data) {
        // Base64 strings have a "data:application/xxx;base64," prefix followed by the encoded data
        // Split by comma and get the second part (or empty string if no comma found)
        const parts = file.data.split(',');
        const base64Data = parts.length > 1 ? parts[1] : '';
        
        if (base64Data) {
          // Calculate original binary size accounting for padding characters
          // Remove padding ('=') and calculate: ceil(length * 3 / 4)
          const dataWithoutPadding = base64Data.replace(/=/g, '');
          totalSize += Math.ceil(dataWithoutPadding.length * 3 / 4);
        }
      }
    }
  }
  
  return totalSize;
}

/**
 * Count total documents in cache
 * @param cache - Array of DocumentCache
 * @returns Total number of documents
 */
function countTotalDocuments(cache: DocumentCache[]): number {
  return cache.reduce((total, category) => total + category.files.length, 0);
}

/**
 * Save document cache to IndexedDB
 * @param cache - Array of DocumentCache to save
 */
export async function saveDocumentCache(cache: DocumentCache[]): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DOCUMENTS], "readwrite");
    const store = transaction.objectStore(STORE_NAMES.DOCUMENTS);
    
    const cacheEntry: DocumentCacheEntry = {
      id: "documents",
      data: cache,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      count: countTotalDocuments(cache),
      size: calculateCacheSize(cache),
    };
    
    const request = store.put(cacheEntry);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log("Document cache saved successfully", {
          count: cacheEntry.count,
          size: `${(cacheEntry.size / 1024 / 1024).toFixed(2)} MB`,
          categories: cache.length,
        });
        resolve();
      };
      
      request.onerror = () => {
        console.error("Failed to save document cache:", request.error);
        reject(new Error("Failed to save document cache"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error saving document cache:", error);
    throw error;
  }
}

/**
 * Retrieve cached document
 * @param categoryId - Category ID
 * @param filename - Document filename
 * @returns Promise with Base64 data URL or null if not found
 */
export async function getCachedDocument(
  categoryId: string,
  filename: string
): Promise<string | null> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DOCUMENTS], "readonly");
    const store = transaction.objectStore(STORE_NAMES.DOCUMENTS);
    const request = store.get("documents");
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry = request.result as DocumentCacheEntry | undefined;
        
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
        
        // Find the document
        const file = category.files.find(f => f.filename === filename);
        if (!file || !file.data) {
          resolve(null);
          return;
        }
        
        resolve(file.data);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve cached document:", request.error);
        reject(new Error("Failed to retrieve cached document"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving cached document:", error);
    return null; // Return null on error instead of throwing
  }
}

/**
 * Get document cache metadata
 * @returns Promise with cache metadata or null if not found
 */
export async function getDocumentCacheMetadata(): Promise<DocumentCacheMetadata | null> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DOCUMENTS], "readonly");
    const store = transaction.objectStore(STORE_NAMES.DOCUMENTS);
    const request = store.get("documents");
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry = request.result as DocumentCacheEntry | undefined;
        
        if (!cacheEntry) {
          resolve(null);
          return;
        }
        
        const metadata: DocumentCacheMetadata = {
          timestamp: cacheEntry.timestamp,
          lastUpdated: formatThaiDate(cacheEntry.timestamp),
          count: cacheEntry.count,
          size: cacheEntry.size,
          version: cacheEntry.version,
        };
        
        resolve(metadata);
      };
      
      request.onerror = () => {
        console.error("Failed to retrieve document cache metadata:", request.error);
        reject(new Error("Failed to retrieve document cache metadata"));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving document cache metadata:", error);
    return null; // Return null on error instead of throwing
  }
}

/**
 * Clear document cache from IndexedDB
 */
export async function clearDocumentCache(): Promise<void> {
  try {
    const db = await openDatabase();
    
    const transaction = db.transaction([STORE_NAMES.DOCUMENTS], "readwrite");
    const store = transaction.objectStore(STORE_NAMES.DOCUMENTS);
    
    store.delete("documents");
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log("Document cache cleared successfully");
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        console.error("Failed to clear document cache:", transaction.error);
        db.close();
        reject(new Error("Failed to clear document cache"));
      };
    });
  } catch (error) {
    console.error("Error clearing document cache:", error);
    throw error;
  }
}
