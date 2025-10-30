import type { CategoryStore } from '../types/flashcard';

/**
 * API Configuration
 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000, // 10 seconds
};

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
      if (!category.id || !category.nameTh || !category.nameEn || !category.icon || !Array.isArray(category.questions)) {
        throw new Error('Invalid category structure in API response');
      }
      
      // Validate each question in the category
      for (const question of category.questions) {
        if (typeof question.id !== 'number' || !question.question || !question.answer) {
          throw new Error('Invalid question structure in API response');
        }
      }
    }

    return data as CategoryStore[];
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
    if (!data.id || !data.nameTh || !data.nameEn || !data.icon || !Array.isArray(data.questions)) {
      throw new Error('Invalid category structure in API response');
    }
    
    // Validate each question
    for (const question of data.questions) {
      if (typeof question.id !== 'number' || !question.question || !question.answer) {
        throw new Error('Invalid question structure in API response');
      }
    }
    
    return data as CategoryStore;
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
