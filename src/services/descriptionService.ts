import type { SectionDescription, DescriptionCache } from "../types/description";
import categoriesConfig from "../config/categories.json";

/**
 * API Configuration
 */
const DESCRIPTION_API_BASE_URL =
  "https://raw.githubusercontent.com/WaiRung/thai-law-data/main/api/descriptions";

/**
 * Build category ID to API path(s) mapping from config
 * Maps Thai category names to their corresponding API directory name(s)
 * Supports three formats for backward compatibility:
 * 1. Single descriptionApiPath string (legacy)
 * 2. Array of descriptionApiPath strings
 * 3. dataSources array with paired apiFilename/filterFilename/descriptionApiPath (new format)
 */
function buildCategoryApiMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const category of categoriesConfig.categories) {
    // New format: dataSources array (highest priority)
    if (category.dataSources && Array.isArray(category.dataSources)) {
      map[category.id] = category.dataSources
        .map(ds => ds.descriptionApiPath)
        .filter((path): path is string => path != null && path !== ''); // Filter out undefined/null/empty strings
    }
    // Legacy format: descriptionApiPath field
    else if (category.descriptionApiPath) {
      // Support both single string (backward compatible) and array of strings
      map[category.id] = Array.isArray(category.descriptionApiPath) 
        ? category.descriptionApiPath 
        : [category.descriptionApiPath];
    }
  }
  return map;
}

// Cache the mapping to avoid rebuilding it repeatedly
const CATEGORY_API_MAP = buildCategoryApiMap();

/**
 * Extract the base section number from a section ID
 * @param sectionId - Section ID in Thai format (e.g., "มาตรา 656", "มาตรา 656 วรรค 2", "มาตรา 269/1")
 * @returns The section number as a string (including /X suffix if present) or null if not found
 */
function extractSectionNumber(sectionId: string): string | null {
  const match = sectionId.match(/มาตรา\s+(\d+(?:\/\d+)?)/);
  return match ? match[1] : null;
}

/**
 * Parse section ID to filename format
 * Converts "มาตรา XXX" or "มาตรา XXX วรรค Y" to "section_XXX.json"
 * Converts "มาตรา XXX/Y" to "section_XXX_Y.json"
 * @param sectionId - Section ID in Thai format (e.g., "มาตรา 656", "มาตรา 656 วรรค 2", "มาตรา 269/1")
 * @returns Filename in format "section_XXX.json" or "section_XXX_Y.json"
 */
function parseSectionIdToFilename(sectionId: string): string {
  const sectionNumber = extractSectionNumber(sectionId);
  if (sectionNumber) {
    // Replace forward slash with underscore for filename
    return `section_${sectionNumber.replace('/', '_')}.json`;
  }
  return "";
}

/**
 * Fetch description for a single section
 * Tries multiple API paths if available (supports both single and multiple paths)
 * @param categoryId - Category ID (Thai name)
 * @param sectionId - Section ID (e.g., "มาตรา 656")
 * @returns Promise with SectionDescription or null if not found
 */
export async function fetchSectionDescription(
  categoryId: string,
  sectionId: string
): Promise<SectionDescription | null> {
  const categoryPaths = CATEGORY_API_MAP[categoryId];
  if (!categoryPaths || categoryPaths.length === 0) {
    // Category doesn't have a description API path configured - this is expected
    return null;
  }

  const filename = parseSectionIdToFilename(sectionId);
  if (!filename) {
    // Section ID format is not recognized - this is expected for some sections
    return null;
  }

  // Try each API path until we find the description
  for (const categoryPath of categoryPaths) {
    const url = `${DESCRIPTION_API_BASE_URL}/${categoryPath}/${filename}`;

    try {
      const response = await fetch(url);

      // 404 is expected for sections without descriptions - try next path
      if (response.status === 404) {
        continue;
      }

      // Other non-success responses are also handled gracefully
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      return data as SectionDescription;
    } catch {
      // Network errors or JSON parsing errors - try next path
      // These are expected when description files don't exist
      continue;
    }
  }

  // No description found in any of the paths
  return null;
}

/**
 * Fetch descriptions for multiple sections
 * Deduplicates requests by base section number to avoid redundant network calls
 * @param categoryId - Category ID (Thai name)
 * @param sectionIds - Array of section IDs
 * @returns Promise with DescriptionCache
 */
export async function fetchSectionDescriptions(
  categoryId: string,
  sectionIds: string[]
): Promise<DescriptionCache> {
  const cache: DescriptionCache = {};

  // Group section IDs by their base section number to avoid duplicate requests
  // e.g., "มาตรา 7", "มาตรา 7 วรรค 1", "มาตรา 7 วรรค 2" all map to section number "7"
  const sectionNumberToIds: Map<string, string[]> = new Map();

  for (const sectionId of sectionIds) {
    const sectionNumber = extractSectionNumber(sectionId);
    if (sectionNumber) {
      if (!sectionNumberToIds.has(sectionNumber)) {
        sectionNumberToIds.set(sectionNumber, []);
      }
      sectionNumberToIds.get(sectionNumber)!.push(sectionId);
    }
  }

  // Fetch descriptions only for unique base section numbers
  const uniqueSectionNumbers = Array.from(sectionNumberToIds.keys());

  // Create a representative section ID for each unique section number
  // Use the format "มาตรา XXX" to fetch the description
  const promises = uniqueSectionNumbers.map(async (sectionNumber) => {
    const representativeId = `มาตรา ${sectionNumber}`;
    const description = await fetchSectionDescription(categoryId, representativeId);

    if (description) {
      // Apply the fetched description to all section IDs that share this base section number
      const relatedIds = sectionNumberToIds.get(sectionNumber) || [];
      for (const sectionId of relatedIds) {
        cache[sectionId] = description;
      }
    }
  });

  await Promise.all(promises);
  return cache;
}

/**
 * Fetch all descriptions for all categories
 * @param categories - Array of category objects with id and section IDs
 * @returns Promise with combined DescriptionCache
 */
export async function fetchAllDescriptions(
  categories: Array<{ categoryId: string; sectionIds: string[] }>
): Promise<DescriptionCache> {
  const allCaches = await Promise.all(
    categories.map((category) =>
      fetchSectionDescriptions(category.categoryId, category.sectionIds)
    )
  );

  // Merge all caches into one
  const combinedCache: DescriptionCache = {};
  for (const cache of allCaches) {
    Object.assign(combinedCache, cache);
  }

  return combinedCache;
}
