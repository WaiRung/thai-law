import type { QuestionFilter, Flashcard } from "../types/flashcard";
import categoriesConfig from "../config/categories.json";

// Import all filter files using Vite's glob import
const filterModules = import.meta.glob<{ default: QuestionFilter }>("../filters/**/*.json");

// Map to store category filters as Sets for efficient lookup
const filterCache = new Map<string, Set<string>>();

// Cache for loaded filter data
const loadedFilters = new Map<string, QuestionFilter>();

/**
 * Dynamically load a filter file based on the filename
 * @param filterFilename - Relative path to filter file (e.g., "civil/loan.json")
 * @returns Promise with QuestionFilter or null if not found
 */
async function loadFilterFile(filterFilename: string): Promise<QuestionFilter | null> {
  try {
    const path = `../filters/${filterFilename}`;
    const loader = filterModules[path];
    if (!loader) {
      console.error(`Filter not found in glob imports: ${filterFilename}`);
      return null;
    }
    const filterModule = await loader();
    return filterModule.default;
  } catch (error) {
    console.error(`Failed to load filter: ${filterFilename}`, error);
    return null;
  }
}

/**
 * Get filter data for a category ID
 * Supports three formats for backward compatibility:
 * 1. Single filterFilename string (legacy)
 * 2. Array of filterFilename strings
 * 3. dataSources array with paired apiFilename/filterFilename/descriptionApiPath (new format)
 * @param categoryId - The category ID
 * @returns Promise with QuestionFilter or null if not found
 */
async function getCategoryFilterData(categoryId: string): Promise<QuestionFilter | null> {
  // Check if already loaded
  if (loadedFilters.has(categoryId)) {
    return loadedFilters.get(categoryId)!;
  }

  // Find the category in config
  const categoryConfig = categoriesConfig.categories.find(c => c.id === categoryId);
  if (!categoryConfig) {
    console.log(`Category not found: ${categoryId}`);
    return null;
  }

  let filterFilenames: string[] = [];

  // New format: dataSources array (highest priority)
  if (categoryConfig.dataSources && Array.isArray(categoryConfig.dataSources)) {
    filterFilenames = categoryConfig.dataSources
      .map(ds => ds.filterFilename)
      .filter((filename): filename is string => filename != null && filename !== ''); // Filter out undefined/null/empty strings
  }
  // Legacy format: filterFilename field
  else if (categoryConfig.filterFilename) {
    // Support both single string (backward compatible) and array of strings
    filterFilenames = Array.isArray(categoryConfig.filterFilename) 
      ? categoryConfig.filterFilename 
      : [categoryConfig.filterFilename];
  }

  // If no filter filenames found, return null (means allow all questions)
  if (filterFilenames.length === 0) {
    console.log(`No filter filename found for category: ${categoryId}`);
    return null;
  }

  // Load all filter files and merge their allowed question IDs
  const allAllowedIds: string[] = [];
  
  for (const filename of filterFilenames) {
    const filter = await loadFilterFile(filename);
    if (filter && filter.allowedQuestionIds) {
      allAllowedIds.push(...filter.allowedQuestionIds);
    }
  }

  // If no valid filters were loaded, return null
  if (allAllowedIds.length === 0) {
    console.log(`No valid filters loaded for category: ${categoryId}`);
    return null;
  }

  // Create a merged filter with deduplicated question IDs
  const mergedFilter: QuestionFilter = {
    categoryId,
    allowedQuestionIds: [...new Set(allAllowedIds)], // Remove duplicates
  };

  loadedFilters.set(categoryId, mergedFilter);
  return mergedFilter;
}

/**
 * Load allowed question IDs for a category
 * Returns a Set of allowed IDs, or null if no filter exists
 */
export async function loadCategoryFilter(
  categoryId: string,
): Promise<Set<string> | null> {
  // Check if already cached
  if (filterCache.has(categoryId)) {
    return filterCache.get(categoryId)!;
  }

  // Get the filter data for this category
  const filter = await getCategoryFilterData(categoryId);
  if (!filter) {
    // No filter defined for this category - allow all questions
    console.log(`No filter defined for category: ${categoryId}, allowing all questions`);
    return null;
  }

  // Validate the filter
  if (!filter.allowedQuestionIds || !Array.isArray(filter.allowedQuestionIds)) {
    console.warn(`Invalid filter format for category: ${categoryId}`);
    return null;
  }

  // Create a Set for efficient lookup
  const allowedIdsSet = new Set(filter.allowedQuestionIds);

  // Cache the Set for future use
  filterCache.set(categoryId, allowedIdsSet);

  console.log(`Loaded filter for ${categoryId}: ${allowedIdsSet.size} allowed IDs`);
  return allowedIdsSet;
}

/**
 * Filter questions based on allowed IDs
 * If no filter exists for the category, returns all questions
 */
export async function filterQuestions(
  categoryId: string,
  questions: Flashcard[],
): Promise<Flashcard[]> {
  const allowedIds = await loadCategoryFilter(categoryId);

  // If no filter exists, return all questions
  if (!allowedIds) {
    return questions;
  }

  // Filter questions using the Set for O(1) lookup
  return questions.filter((question) => allowedIds.has(question.id));
}

/**
 * Clear the filter cache
 * Useful for development or if filters need to be reloaded
 */
export function clearFilterCache(): void {
  filterCache.clear();
}

/**
 * Check if a specific question ID is allowed for a category
 */
export async function isQuestionAllowed(
  categoryId: string,
  questionId: string,
): Promise<boolean> {
  const allowedIds = await loadCategoryFilter(categoryId);

  // If no filter exists, all questions are allowed
  if (!allowedIds) {
    return true;
  }

  return allowedIds.has(questionId);
}
