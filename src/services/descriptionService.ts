import type { SectionDescription, DescriptionCache } from "../types/description";

/**
 * API Configuration
 */
const DESCRIPTION_API_BASE_URL =
  "https://raw.githubusercontent.com/WaiRung/thai-law-data/main/api/descriptions";

/**
 * Category ID to API path mapping
 * Maps Thai category names to their corresponding API directory names
 */
const CATEGORY_API_MAP: Record<string, string> = {
  "ยืม ฝากทรัพย์ เก็บของในคลังสินค้า": "civil_and_commercial_code",
  "กฎหมายมรดก": "civil_and_commercial_code",
  "กฎหมายอาญา 2": "criminal_code",
  "กฎหมายวิธีพิจารณาความแพ่ง": "civil_procedure_code",
};

/**
 * Parse section ID to filename format
 * Converts "มาตรา XXX" or "มาตรา XXX วรรค Y" to "section_XXX.json"
 * @param sectionId - Section ID in Thai format (e.g., "มาตรา 656", "มาตรา 656 วรรค 2")
 * @returns Filename in format "section_XXX.json"
 */
function parseSectionIdToFilename(sectionId: string): string {
  // Extract the section number from formats like "มาตรา 656" or "มาตรา 656 วรรค 2"
  const match = sectionId.match(/มาตรา\s+(\d+)/);
  if (match) {
    return `section_${match[1]}.json`;
  }
  return "";
}

/**
 * Fetch description for a single section
 * @param categoryId - Category ID (Thai name)
 * @param sectionId - Section ID (e.g., "มาตรา 656")
 * @returns Promise with SectionDescription or null if not found
 */
export async function fetchSectionDescription(
  categoryId: string,
  sectionId: string
): Promise<SectionDescription | null> {
  const categoryPath = CATEGORY_API_MAP[categoryId];
  if (!categoryPath) {
    console.warn(`No API mapping found for category: ${categoryId}`);
    return null;
  }

  const filename = parseSectionIdToFilename(sectionId);
  if (!filename) {
    console.warn(`Could not parse section ID: ${sectionId}`);
    return null;
  }

  const url = `${DESCRIPTION_API_BASE_URL}/${categoryPath}/${filename}`;

  try {
    const response = await fetch(url);

    // 404 is expected for sections without descriptions
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.warn(`Failed to fetch description from ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as SectionDescription;
  } catch (error) {
    console.error(`Error fetching description for ${sectionId}:`, error);
    return null;
  }
}

/**
 * Fetch descriptions for multiple sections
 * @param categoryId - Category ID (Thai name)
 * @param sectionIds - Array of section IDs
 * @returns Promise with DescriptionCache
 */
export async function fetchSectionDescriptions(
  categoryId: string,
  sectionIds: string[]
): Promise<DescriptionCache> {
  const cache: DescriptionCache = {};

  // Fetch all descriptions in parallel
  const promises = sectionIds.map((sectionId) =>
    fetchSectionDescription(categoryId, sectionId).then((description) => {
      if (description) {
        cache[sectionId] = description;
      }
    })
  );

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
