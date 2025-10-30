import type { CategoryStore, Flashcard } from '../types/flashcard';

/**
 * API Configuration
 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000, // 10 seconds
};

/**
 * Validate a flashcard question structure
 * @param question - The question object to validate
 * @throws Error if validation fails
 */
function validateQuestion(question: any): asserts question is Flashcard {
  if (
    typeof question.id !== 'number' ||
    typeof question.question !== 'string' ||
    typeof question.answer !== 'string' ||
    !question.question.trim() ||
    !question.answer.trim()
  ) {
    throw new Error('Invalid question structure in API response');
  }
}

/**
 * Validate a category structure
 * @param category - The category object to validate
 * @throws Error if validation fails
 */
function validateCategory(category: any): asserts category is CategoryStore {
  if (
    typeof category.id !== 'string' ||
    typeof category.nameTh !== 'string' ||
    typeof category.nameEn !== 'string' ||
    typeof category.icon !== 'string' ||
    !category.id.trim() ||
    !category.nameTh.trim() ||
    !category.nameEn.trim() ||
    !category.icon.trim() ||
    !Array.isArray(category.questions)
  ) {
    throw new Error('Invalid category structure in API response');
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
    throw new Error('API_BASE_URL not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/categories`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response data
    if (!Array.isArray(data)) {
      throw new Error('Invalid API response: expected array of categories');
    }

    // Validate each category structure
    for (const category of data) {
      validateCategory(category);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('API request timeout');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while fetching categories');
  }
}

/**
 * Fetch a specific category by ID
 * @param categoryId - The ID of the category to fetch
 * @returns Promise with CategoryStore
 */
export async function fetchCategoryById(categoryId: string): Promise<CategoryStore> {
  if (!API_CONFIG.baseUrl) {
    throw new Error('API_BASE_URL not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/categories/${encodeURIComponent(categoryId)}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Validate category structure
    validateCategory(data);
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('API request timeout');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while fetching category');
  }
}
