import type { QuestionFilter, Flashcard } from "../types/flashcard";

// Import filter files explicitly
import civilFilter from "../filters/civil/civil.json";
import loanFilter from "../filters/civil/loan.json";
import criminalFilter from "../filters/criminal/criminal.json";

// Map to store category filters as Sets for efficient lookup
const filterCache = new Map<string, Set<string>>();

// Map category IDs to imported filter data
const categoryFilters: Record<string, QuestionFilter> = {
  "ยืม ฝากทรัพย์ เก็บของในคลังสินค้า": loanFilter,
  "กฎหมายแพ่ง": civilFilter,
  "กฎหมายอาญา": criminalFilter,
  // Add more filters as needed
};

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
  const filter = categoryFilters[categoryId];
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
