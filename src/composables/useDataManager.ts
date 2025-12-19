import { ref } from 'vue';
import { fetchCategories } from '../services/api';
import {
  getCategoriesCache,
  saveCategoriesCache,
  getCacheMetadata,
  clearCache,
  isCacheValid,
  saveDescriptionsCache,
} from '../services/cache';
import { fetchAllDescriptions } from '../services/descriptionService';
import { downloadDiagramImages, saveDiagramCache } from '../services/diagramService';
import { getCategorySections } from '../services/sectionService';
import type { CategoryStore, CacheMetadata } from '../types/flashcard';

/**
 * Composable for managing data loading and caching
 * This handles downloading data from API and caching it for offline use
 */
export function useDataManager() {
  // Cache Management
  const isCacheAvailable = ref(false);
  const cacheMetadata = ref<CacheMetadata | null>(null);
  const isDownloading = ref(false);
  const downloadSuccess = ref(false);
  const error = ref<string | null>(null);

  /**
   * Check if cache is available and get metadata
   */
  const checkCache = async () => {
    const metadata = await getCacheMetadata();
    if (metadata) {
      cacheMetadata.value = metadata;
      isCacheAvailable.value = true;
    }
    return metadata;
  };

  /**
   * Download data from API and save to cache
   */
  const downloadData = async (): Promise<CategoryStore[] | null> => {
    isDownloading.value = true;
    downloadSuccess.value = false;
    error.value = null;

    try {
      // Clear old cache first (if exists)
      if (isCacheAvailable.value) {
        console.log('Clearing old cache...');
        await clearCache();
      }

      // Force fetch from API
      console.log('Fetching fresh data from API...');
      const apiCategories = await fetchCategories();

      // Save categories to IndexedDB on success
      await saveCategoriesCache(apiCategories);

      // Fetch descriptions for all sections across all categories
      try {
        console.log('Fetching descriptions...');
        const categoriesWithSections = await Promise.all(
          apiCategories.map(async (category) => {
            const sectionIds = await getCategorySections(category.id);
            return {
              categoryId: category.id,
              sectionIds,
            };
          })
        );

        const descriptions = await fetchAllDescriptions(categoriesWithSections);
        await saveDescriptionsCache(descriptions);
        console.log('Descriptions cached successfully');
      } catch (descError) {
        console.warn('Failed to fetch descriptions, continuing without them:', descError);
        // Don't fail the entire download if descriptions fail
        // Skip saving to avoid overwriting existing cache with empty data
      }

      // Download and cache diagram images
      try {
        console.log('Downloading diagram images...');
        const diagramCache = await downloadDiagramImages();
        await saveDiagramCache(diagramCache);
        console.log('Diagram images cached successfully');
      } catch (diagramError) {
        console.warn('Failed to download diagram images, continuing without them:', diagramError);
        // Don't fail the entire download if diagram images fail
      }

      // Update cache metadata
      const metadata = await getCacheMetadata();
      cacheMetadata.value = metadata;
      isCacheAvailable.value = true;

      // Show success message for 5 seconds
      downloadSuccess.value = true;
      setTimeout(() => {
        downloadSuccess.value = false;
      }, 5000);

      console.log('Data downloaded and cached successfully');
      return apiCategories;
    } catch (err) {
      console.error('Failed to download data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('not configured')) {
        error.value = 'API ไม่ได้ถูกกำหนดค่า ไม่สามารถโหลดข้อมูลได้';
      } else {
        error.value = 'ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อออินเทอร์เน็ต';
      }

      setTimeout(() => {
        error.value = null;
      }, 5000);

      return null;
    } finally {
      isDownloading.value = false;
    }
  };

  /**
   * Load categories from cache or API
   * Prioritizes cache for instant loading, falls back to API if cache is stale or missing
   */
  const loadCategories = async (): Promise<CategoryStore[] | null> => {
    try {
      // First, check IndexedDB cache and validate it
      const cachedCategories = await getCategoriesCache();
      const cacheIsValid = await isCacheValid();

      if (cachedCategories && cachedCategories.length > 0 && cacheIsValid) {
        // Cache exists and is valid, load from cache instantly
        console.log('Loading categories from cache');
        isCacheAvailable.value = true;
        return cachedCategories;
      }

      // Cache is stale or doesn't exist, try to refresh from API
      if (cachedCategories && !cacheIsValid) {
        console.log('Cache is stale, refreshing from API');
      } else {
        console.log('No cache found, fetching from API');
      }

      // Try to fetch from API
      const apiCategories = await fetchCategories();

      // Automatically save to cache on successful API fetch
      await saveCategoriesCache(apiCategories);

      // Update cache metadata
      const metadata = await getCacheMetadata();
      cacheMetadata.value = metadata;
      isCacheAvailable.value = true;

      return apiCategories;
    } catch (err) {
      console.warn('Failed to load categories from API:', err);
      return null;
    }
  };

  return {
    isCacheAvailable,
    cacheMetadata,
    isDownloading,
    downloadSuccess,
    error,
    checkCache,
    downloadData,
    loadCategories,
  };
}
