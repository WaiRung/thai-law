/**
 * Document types for caching and display
 */

/**
 * Document file with optional Base64 data
 */
export interface DocumentFile {
  filename: string;
  nameTh: string;
  nameEn: string;
  data?: string; // Base64 data URL for cached documents
}

/**
 * Document category structure
 */
export interface DocumentCategory {
  categoryId: string;
  categoryPath: string;
  nameTh: string;
  nameEn: string;
  files: DocumentFile[];
}

/**
 * Cache structure for documents
 */
export interface DocumentCache {
  categoryId: string;
  files: DocumentFile[];
}

/**
 * Metadata about the document cache
 */
export interface DocumentCacheMetadata {
  timestamp: number;
  lastUpdated: string;
  count: number; // Total number of cached documents
  size: number; // Total size in bytes
  version: string;
}
