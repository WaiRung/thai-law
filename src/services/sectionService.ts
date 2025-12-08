import type {
  QuestionFilter,
  Flashcard,
  CategoryStore,
} from "../types/flashcard";
import type { DescriptionContent } from "../types/description";
import { categoryStores } from "../data/categoryStores";
import { getDescriptionsCache } from "./cache";
import categoriesConfig from "../config/categories.json";

interface SectionContent {
  id: string;
  question: string;
  answer: string;
  title?: string; // Optional title for whole sections
  descriptions?: DescriptionContent[]; // Optional descriptions
}

interface CategorySectionsWithContent {
  categoryId: string;
  categoryName: string;
  sections: SectionContent[];
}

/**
 * Import all filter files using Vite's glob import
 * This ensures Vite can statically analyze the imports at build time
 */
const filterModules = import.meta.glob<{ default: QuestionFilter }>("../filters/**/*.json");

/**
 * Dynamically load a filter file based on the filename
 * @param filterFilename - Relative path to filter file (e.g., "civil/loan.json")
 * @returns Promise with QuestionFilter or null if not found
 */
async function loadFilter(filterFilename: string): Promise<QuestionFilter | null> {
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
 * Load all filters dynamically from the config
 * Supports three formats for backward compatibility:
 * 1. Single filterFilename string (legacy)
 * 2. Array of filterFilename strings
 * 3. dataSources array with paired apiFilename/filterFilename/descriptionApiPath (new format)
 * @returns Promise with array of QuestionFilter
 */
async function loadAllFilters(): Promise<QuestionFilter[]> {
  const filters: QuestionFilter[] = [];
  
  for (const category of categoriesConfig.categories) {
    let filterFilenames: string[] = [];

    // New format: dataSources array (highest priority)
    if (category.dataSources && Array.isArray(category.dataSources)) {
      filterFilenames = category.dataSources
        .map(ds => ds.filterFilename)
        .filter((filename): filename is string => filename != null && filename !== ''); // Filter out undefined/null/empty strings
    }
    // Legacy format: filterFilename field
    else if (category.filterFilename) {
      // Support both single string (backward compatible) and array of strings
      filterFilenames = Array.isArray(category.filterFilename) 
        ? category.filterFilename 
        : [category.filterFilename];
    }

    // If we have filter filenames, load and merge them
    if (filterFilenames.length > 0) {
      // Load all filter files for this category
      const categoryAllowedIds: string[] = [];
      
      for (const filename of filterFilenames) {
        const filter = await loadFilter(filename);
        if (filter && filter.allowedQuestionIds) {
          categoryAllowedIds.push(...filter.allowedQuestionIds);
        }
      }

      // If any filters were loaded, create a merged filter for this category
      if (categoryAllowedIds.length > 0) {
        filters.push({
          categoryId: category.id,
          allowedQuestionIds: [...new Set(categoryAllowedIds)], // Remove duplicates
        });
      }
    }
  }
  
  return filters;
}

// Cache for loaded filters to avoid repeated dynamic imports
let filtersCache: QuestionFilter[] | null = null;

/**
 * Get all available filters (with caching)
 * @returns Promise with array of QuestionFilter
 */
async function getAllFilters(): Promise<QuestionFilter[]> {
  if (filtersCache === null) {
    filtersCache = await loadAllFilters();
  }
  return filtersCache;
}

/**
 * Get all sections from all filters, grouped by category with full content
 * @param categories - Optional array of CategoryStore to use instead of static data
 * @returns Promise with array of CategorySectionsWithContent
 */
export async function getAllSections(
  categories?: CategoryStore[],
): Promise<CategorySectionsWithContent[]> {
  const categorySections: CategorySectionsWithContent[] = [];
  // Use provided categories or fall back to static data
  const categoryData = categories || categoryStores;

  // Load descriptions from cache
  const descriptionsCache = await getDescriptionsCache();

  // Load all filters dynamically
  const allFilters = await getAllFilters();

  for (const filter of allFilters) {
    if (filter.allowedQuestionIds && filter.allowedQuestionIds.length > 0) {
      // Find the corresponding category store
      const categoryStore = categoryData.find(
        (store) => store.id === filter.categoryId,
      );

      if (!categoryStore) {
        console.warn(`Category store not found for: ${filter.categoryId}`);
        continue;
      }

      // Create a map of question IDs to flashcard data for quick lookup
      const questionMap = new Map<string, Flashcard>();
      categoryStore.questions.forEach((q) => {
        questionMap.set(q.id, q);
      });

      // Get section content for allowed question IDs
      const sectionsWithContent: SectionContent[] = [];
      const sortedSectionIds = [...filter.allowedQuestionIds].sort((a, b) => {
        // Sort sections numerically by extracting the section number
        const extractNumber = (str: string) => {
          const match = str.match(/มาตรา\s+(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return extractNumber(a) - extractNumber(b);
      });

      for (const sectionId of sortedSectionIds) {
        const flashcard = questionMap.get(sectionId);
        const description = descriptionsCache[sectionId];

        if (flashcard) {
          sectionsWithContent.push({
            id: flashcard.id,
            question: flashcard.question,
            answer: flashcard.answer,
            title: flashcard.title, // Include title if present
            descriptions: description?.descriptions, // Include descriptions if available
          });
        } else {
          // If no content found, just show the ID
          sectionsWithContent.push({
            id: sectionId,
            question: sectionId,
            answer: "เนื้อหายังไม่มีในระบบ",
            descriptions: description?.descriptions,
          });
        }
      }

      categorySections.push({
        categoryId: filter.categoryId,
        categoryName: filter.categoryId,
        sections: sectionsWithContent,
      });
    }
  }

  return categorySections;
}

/**
 * Get sections for a specific category
 * @param categoryId - The category ID to get sections for
 * @returns Promise with array of section IDs
 */
export async function getCategorySections(
  categoryId: string,
): Promise<string[]> {
  const allFilters = await getAllFilters();
  const filter = allFilters.find((f) => f.categoryId === categoryId);
  if (!filter || !filter.allowedQuestionIds) {
    return [];
  }

  return [...filter.allowedQuestionIds].sort((a, b) => {
    // Sort sections numerically by extracting the section number
    const extractNumber = (str: string) => {
      const match = str.match(/มาตรา\s+(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    return extractNumber(a) - extractNumber(b);
  });
}

/**
 * Get total count of sections across all categories
 * @returns Promise with total number of sections
 */
export async function getTotalSectionsCount(): Promise<number> {
  const allFilters = await getAllFilters();
  return allFilters.reduce(
    (total, filter) => total + (filter.allowedQuestionIds?.length || 0),
    0,
  );
}
