import type { CategoryStore, Flashcard } from "../types/flashcard";

/**
 * API Configuration
 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 10000, // 10 seconds
};

/**
 * Category ID to filename mapping
 * Maps Thai category IDs to their corresponding JSON filenames
 */
const CATEGORY_FILE_MAP: Record<string, string> = {
  กฎหมายแพ่ง: "civil_and_commercial_code",
  กฎหมายอาญา: "criminal_code",
  กฎหมายวิธพิจารณาความแพ่ง: "civil_procedure_code",
};

/**
 * Validate a flashcard question structure
 * @param question - The question object to validate
 * @throws Error if validation fails
 */
function validateQuestion(question: any): asserts question is Flashcard {
  if (typeof question.id !== "string") {
    throw new Error("Invalid question structure: id must be a string");
  }
  if (!question.id.trim()) {
    throw new Error("Invalid question structure: id cannot be empty");
  }
  if (typeof question.question !== "string") {
    throw new Error("Invalid question structure: question must be a string");
  }
  if (!question.question.trim()) {
    throw new Error("Invalid question structure: question cannot be empty");
  }
  if (typeof question.answer !== "string") {
    throw new Error("Invalid question structure: answer must be a string");
  }
  if (!question.answer.trim()) {
    throw new Error("Invalid question structure: answer cannot be empty");
  }
}

/**
 * Validate a category structure
 * @param category - The category object to validate
 * @throws Error if validation fails
 */
function validateCategory(category: any): asserts category is CategoryStore {
  if (typeof category.id !== "string") {
    throw new Error("Invalid category structure: id must be a string");
  }
  if (!category.id.trim()) {
    throw new Error("Invalid category structure: id cannot be empty");
  }
  if (typeof category.nameTh !== "string") {
    throw new Error("Invalid category structure: nameTh must be a string");
  }
  if (!category.nameTh.trim()) {
    throw new Error("Invalid category structure: nameTh cannot be empty");
  }
  if (typeof category.nameEn !== "string") {
    throw new Error("Invalid category structure: nameEn must be a string");
  }
  if (!category.nameEn.trim()) {
    throw new Error("Invalid category structure: nameEn cannot be empty");
  }
  if (typeof category.icon !== "string") {
    throw new Error("Invalid category structure: icon must be a string");
  }
  if (!category.icon.trim()) {
    throw new Error("Invalid category structure: icon cannot be empty");
  }
  if (!Array.isArray(category.questions)) {
    throw new Error("Invalid category structure: questions must be an array");
  }
  // Validate that questions array has the correct structure
  for (const question of category.questions) {
    // Check if question has the new structure with title and content
    if (question.title !== undefined && question.content !== undefined) {
      // New structure validation
      if (typeof question.title !== "string") {
        throw new Error("Invalid question structure: title must be a string");
      }
      if (typeof question.content !== "object" || question.content === null) {
        throw new Error(
          "Invalid question structure: content must be an object",
        );
      }
      if (!Array.isArray(question.content.paragraphs)) {
        throw new Error(
          "Invalid question structure: content.paragraphs must be an array",
        );
      }
      // Validate each paragraph
      for (const paragraph of question.content.paragraphs) {
        if (typeof paragraph.id !== "number") {
          throw new Error("Invalid paragraph structure: id must be a number");
        }
        if (typeof paragraph.content !== "string") {
          throw new Error(
            "Invalid paragraph structure: content must be a string",
          );
        }
        if (
          paragraph.subsections !== null &&
          paragraph.subsections !== undefined
        ) {
          if (!Array.isArray(paragraph.subsections)) {
            throw new Error(
              "Invalid paragraph structure: subsections must be an array or null",
            );
          }
          // Validate each subsection
          for (const subsection of paragraph.subsections) {
            if (typeof subsection.id !== "number") {
              throw new Error(
                "Invalid subsection structure: id must be a number",
              );
            }
            if (typeof subsection.content !== "string") {
              throw new Error(
                "Invalid subsection structure: content must be a string",
              );
            }
          }
        }
      }
    }
  }

  // Validate each question in the category
  for (const question of category.questions) {
    validateQuestion(question);
  }
}

/**
 * Fetch categories from API
 * @returns Promise with array of CategoryStore
 */
export async function fetchCategories(): Promise<CategoryStore[]> {
  // If no API URL is configured, return empty array
  // This allows the app to fall back to static data
  if (!API_CONFIG.baseUrl) {
    throw new Error("API_BASE_URL not configured");
  }

  // Fetch all categories in parallel
  const categoryIds = Object.keys(CATEGORY_FILE_MAP);
  const fetchPromises = categoryIds.map((categoryId) =>
    fetchCategoryById(categoryId),
  );

  try {
    const categories = await Promise.all(fetchPromises);
    return categories;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while fetching categories");
  }
}

/**
 * Fetch a specific category by ID
 * @param categoryId - The ID of the category to fetch
 * @returns Promise with CategoryStore
 */
export async function fetchCategoryById(
  categoryId: string,
): Promise<CategoryStore> {
  if (!API_CONFIG.baseUrl) {
    throw new Error("API_BASE_URL not configured");
  }

  // Get the filename for this category
  const filename = CATEGORY_FILE_MAP[categoryId];
  if (!filename) {
    throw new Error(`Unknown category ID: ${categoryId}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    // Construct the URL using URL constructor for robust URL building
    const url = new URL(`${filename}.json`, API_CONFIG.baseUrl).toString();
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    // Validate category structure
    // Map the response data structure to our expected format
    // The API returns { [categoryName]: questions[] }
    const categoryName = Object.keys(data)[0];
    const questions = data[categoryName];

    // Construct the full category object
    const category = {
      id: categoryId,
      nameTh: categoryId,
      nameEn: filename
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      icon: "📚",
      questions: questions,
    };

    validateCategory(category);
    return category;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("API request timeout");
      }
      throw error;
    }
    throw new Error("Unknown error occurred while fetching category");
  }
}
