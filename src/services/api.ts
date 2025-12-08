import type { CategoryStore, Flashcard } from "../types/flashcard";
import categoriesConfig from "../config/categories.json";

/**
 * Complex format interfaces for API data
 */
interface Subsection {
  id: number;
  content: string;
}

interface Paragraph {
  id: number;
  content: string;
  subsections?: Subsection[] | null;
}

interface QuestionContent {
  paragraphs: Paragraph[];
}

interface ComplexQuestion {
  id: string;
  title: string;
  content: QuestionContent;
}

/**
 * API Configuration
 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 10000, // 10 seconds
};

/**
 * Category ID to filename(s) mapping
 * Maps Thai category IDs to their corresponding JSON filename(s)
 * Supports three formats for backward compatibility:
 * 1. Single apiFilename string (legacy)
 * 2. Array of apiFilename strings
 * 3. dataSources array with paired apiFilename/filterFilename/descriptionApiPath (new format)
 * This mapping is loaded from the categories configuration file
 */
const CATEGORY_FILE_MAP: Record<string, string[]> = categoriesConfig.categories.reduce(
  (map, category) => {
    // New format: dataSources array (highest priority)
    if (category.dataSources && Array.isArray(category.dataSources)) {
      map[category.id] = category.dataSources
        .map(ds => ds.apiFilename)
        .filter((filename): filename is string => filename != null && filename !== ''); // Filter out undefined/null/empty strings
    }
    // Legacy format: apiFilename field
    else if (category.apiFilename) {
      // Support both single string (backward compatible) and array of strings
      map[category.id] = Array.isArray(category.apiFilename) 
        ? category.apiFilename 
        : [category.apiFilename];
    }
    return map;
  },
  {} as Record<string, string[]>
);

/**
 * Map complex format to simple flashcard format
 * This function creates flashcards at multiple levels:
 * - Whole section flashcard
 * - Individual paragraph flashcards (if multiple paragraphs exist)
 * - Individual subsection flashcards
 * @param complexQuestion - Question in complex format (title + content with paragraphs)
 * @returns Array of flashcards
 */
function mapComplexToSimpleFormat(complexQuestion: ComplexQuestion): Flashcard[] {
  const flashcards: Flashcard[] = [];

  // First, create the whole section flashcard (existing behavior)
  const question = complexQuestion.title;
  const answerParts: string[] = [];
  answerParts.push(complexQuestion.id);

  for (const paragraph of complexQuestion.content.paragraphs) {
    answerParts.push("");
    // Add paragraph content
    if (complexQuestion.content.paragraphs.length > 1) {
      answerParts.push(` วรรค ${paragraph.id} ${paragraph.content}`);
    } else {
      answerParts.push(` ${paragraph.content}`);
    }

    // Add subsections if they exist
    if (paragraph.subsections && paragraph.subsections.length > 0) {
      for (const subsection of paragraph.subsections) {
        answerParts.push("");
        answerParts.push(`  (${subsection.id}) ${subsection.content}`);
      }
    }
  }

  const answer = answerParts.join("\n");

  // Add the whole section flashcard with title
  flashcards.push({
    id: complexQuestion.id,
    question: question,
    answer: answer,
    title: complexQuestion.title, // Preserve title for display in section list
  });

  // Extract section number from complexQuestion.id (e.g., "มาตรา 1" -> "1")
  const sectionNumber = complexQuestion.id.replace("มาตรา ", "");

  // Create individual flashcards for each paragraph (if multiple paragraphs exist)
  if (complexQuestion.content.paragraphs.length > 1) {
    for (const paragraph of complexQuestion.content.paragraphs) {
      // Create paragraph ID and question
      const paragraphId = `${complexQuestion.id} วรรค ${paragraph.id}`;
      const paragraphQuestion = `มาตรา ${sectionNumber} วรรค ${paragraph.id}`;
      
      // Build the paragraph answer
      const paragraphAnswerParts: string[] = [];
      paragraphAnswerParts.push(paragraphId);
      paragraphAnswerParts.push("");
      paragraphAnswerParts.push(paragraph.content);
      
      // Add subsections if they exist
      if (paragraph.subsections && paragraph.subsections.length > 0) {
        for (const subsection of paragraph.subsections) {
          paragraphAnswerParts.push("");
          paragraphAnswerParts.push(`  (${subsection.id}) ${subsection.content}`);
        }
      }
      
      const paragraphAnswer = paragraphAnswerParts.join("\n");
      
      // Add the paragraph flashcard
      flashcards.push({
        id: paragraphId,
        question: paragraphQuestion,
        answer: paragraphAnswer,
      });
    }
  }

  // Now create individual flashcards for each subsection
  for (const paragraph of complexQuestion.content.paragraphs) {
    if (paragraph.subsections && paragraph.subsections.length > 0) {
      for (const subsection of paragraph.subsections) {
        // Create subsection ID and question
        // If there are multiple paragraphs, include paragraph number in ID
        // If paragraph not specified but subsection exists, default to paragraph 1
        let subsectionId: string;
        let subsectionQuestion: string;
        
        if (complexQuestion.content.paragraphs.length > 1) {
          // Multiple paragraphs: include paragraph number
          subsectionId = `${complexQuestion.id} วรรค ${paragraph.id} อนุ ${subsection.id}`;
          subsectionQuestion = `มาตรา ${sectionNumber} วรรค ${paragraph.id} อนุ ${subsection.id}`;
        } else {
          // Single paragraph: use implicit paragraph 1 format
          subsectionId = `${complexQuestion.id} อนุ ${subsection.id}`;
          subsectionQuestion = `มาตรา ${sectionNumber} อนุ ${subsection.id}`;
        }
        
        // Build the subsection answer
        const subsectionAnswerParts: string[] = [];
        subsectionAnswerParts.push(subsectionId);
        subsectionAnswerParts.push("");
        subsectionAnswerParts.push(subsection.content);
        
        const subsectionAnswer = subsectionAnswerParts.join("\n");
        
        // Add the subsection flashcard
        flashcards.push({
          id: subsectionId,
          question: subsectionQuestion,
          answer: subsectionAnswer,
        });
      }
    }
  }

  return flashcards;
}

/**
 * Validate a simple flashcard question structure
 * @param question - The question object to validate
 * @throws Error if validation fails
 */
function validateSimpleQuestion(question: any): asserts question is Flashcard {
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
 * Validate complex format question structure
 * @param question - The question object to validate in complex format
 * @throws Error if validation fails
 */
function validateComplexQuestion(
  question: any,
): asserts question is ComplexQuestion {
  if (typeof question.id !== "string") {
    throw new Error("Invalid question structure: id must be a string");
  }
  if (!question.id.trim()) {
    throw new Error("Invalid question structure: id cannot be empty");
  }
  if (typeof question.title !== "string") {
    throw new Error("Invalid question structure: title must be a string");
  }
  if (!question.title.trim()) {
    throw new Error("Invalid question structure: title cannot be empty");
  }
  if (typeof question.content !== "object" || question.content === null) {
    throw new Error("Invalid question structure: content must be an object");
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
      throw new Error("Invalid paragraph structure: content must be a string");
    }
    if (paragraph.subsections !== null && paragraph.subsections !== undefined) {
      if (!Array.isArray(paragraph.subsections)) {
        throw new Error(
          "Invalid paragraph structure: subsections must be an array or null",
        );
      }
      // Validate each subsection
      for (const subsection of paragraph.subsections) {
        console.log(subsection);
        if (typeof subsection.id !== "number") {
          throw new Error("Invalid subsection structure: id must be a number");
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

  // Validate and transform each question in the category
  const transformedQuestions: Flashcard[] = [];
  for (const question of category.questions) {
    // Check if question is in complex format (has title and content)
    if (question.title !== undefined && question.content !== undefined) {
      // Validate complex format
      validateComplexQuestion(question);
      // Map complex format to simple format (now returns array)
      const simpleQuestions = mapComplexToSimpleFormat(question);
      transformedQuestions.push(...simpleQuestions);
    } else {
      // Already in simple format, just validate
      validateSimpleQuestion(question);
      transformedQuestions.push(question);
    }
  }

  // Replace questions with transformed ones
  category.questions = transformedQuestions;
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
 * Supports both single API file (backward compatible) and multiple API files
 * @param categoryId - The ID of the category to fetch
 * @returns Promise with CategoryStore
 */
export async function fetchCategoryById(
  categoryId: string,
): Promise<CategoryStore> {
  if (!API_CONFIG.baseUrl) {
    throw new Error("API_BASE_URL not configured");
  }

  // Get the filename(s) for this category
  const filenames = CATEGORY_FILE_MAP[categoryId];
  if (!filenames || filenames.length === 0) {
    throw new Error(`Unknown category ID: ${categoryId}`);
  }

  // Find the original category configuration to preserve metadata
  const originalCategory = categoriesConfig.categories.find(c => c.id === categoryId);

  // Fetch all API files and merge questions
  const allQuestions: any[] = [];
  
  for (const filename of filenames) {
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
      // The API returns { [categoryName]: questions[] }
      const categoryName = Object.keys(data)[0];
      const questions = data[categoryName];
      
      if (Array.isArray(questions)) {
        allQuestions.push(...questions);
      }
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

  // Use the first filename for generating the English name (fallback if metadata not found)
  const firstFilename = filenames[0];
  
  // Construct the full category object with merged questions
  // Preserve metadata from original configuration if available
  const category = {
    id: categoryId,
    nameTh: originalCategory?.nameTh || categoryId,
    nameEn: originalCategory?.nameEn || firstFilename
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    icon: originalCategory?.icon || "📚",
    questions: allQuestions,
    // Preserve original metadata fields for proper routing and data source handling
    ...(originalCategory?.apiFilename && { apiFilename: originalCategory.apiFilename }),
    ...(originalCategory?.filterFilename && { filterFilename: originalCategory.filterFilename }),
    ...(originalCategory?.descriptionApiPath && { descriptionApiPath: originalCategory.descriptionApiPath }),
    ...(originalCategory?.dataSources && { dataSources: originalCategory.dataSources }),
  };

  validateCategory(category);
  return category;
}
