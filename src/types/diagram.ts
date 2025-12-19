/**
 * Diagram types for caching and display
 */

/**
 * Diagram image with optional Base64 data
 */
export interface DiagramImage {
  filename: string;
  nameTh: string;
  nameEn: string;
  data?: string; // Base64 data URL for cached images
}

/**
 * Diagram category structure
 */
export interface DiagramCategory {
  categoryId: string;
  categoryPath: string;
  nameTh: string;
  nameEn: string;
  images: DiagramImage[];
}

/**
 * Cache structure for diagram images
 */
export interface DiagramCache {
  categoryId: string;
  images: DiagramImage[];
}

/**
 * Metadata about the diagram cache
 */
export interface DiagramCacheMetadata {
  timestamp: number;
  lastUpdated: string;
  count: number; // Total number of cached images
  size: number; // Total size in bytes
  version: string;
}
