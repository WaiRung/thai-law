import type { CategoryStore, Flashcard } from "../types/flashcard";
import categoriesConfig from "../config/categories.json";

/**
 * Complex format interfaces for API data
 */
interface Subsection {
  id: string;
  content: string;
  subsections?: Subsection[] | null; // Recursive: subsections can contain nested subsections
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
  dataSourceIndex?: number; // Optional: Track which data source this question came from
}

/**
 * API Configuration
 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 10000, // 10 seconds
};

/**
 * Recursively format subsections with proper indentation
 * @param subsections - Array of subsections to format
 * @param indentLevel - Current indentation level (0-based)
 * @returns Array of formatted strings
 */
function formatSubsectionsRecursive(subsections: Subsection[], indentLevel: number = 0): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(indentLevel + 1); // +1 because base subsections start with 2 spaces
  
  for (const subsection of subsections) {
    lines.push('');
    lines.push(`${indent}(${subsection.id}) ${subsection.content}`);
    
    // Recursively process nested subsections if they exist
    if (subsection.subsections && subsection.subsections.length > 0) {
      const nestedLines = formatSubsectionsRecursive(subsection.subsections, indentLevel + 1);
      lines.push(...nestedLines);
    }
  }
  
  return lines;
}

/**
 * Recursively collect all subsections and their nested subsections
 * @param subsections - Array of subsections to collect
 * @param sectionId - Section ID (e.g., "มาตรา 1")
 * @param sectionNumber - Section number string (e.g., "1")
 * @param paragraphId - Paragraph ID (optional, for multi-paragraph sections)
 * @param hasMultipleParagraphs - Whether section has multiple paragraphs
 * @param dataSourceIndex - Optional data source index
 * @param sectionPrefix - Optional prefix to use instead of "มาตรา" (e.g., "ข้อ")
 * @returns Array of flashcards for all subsections and their nested subsections
 */
function generateSubsectionFlashcardsRecursive(
  subsections: Subsection[],
  sectionId: string,
  sectionNumber: string,
  paragraphId: number | null,
  hasMultipleParagraphs: boolean,
  dataSourceIndex?: number,
  sectionPrefix: string = "มาตรา"
): Flashcard[] {
  const flashcards: Flashcard[] = [];
  
  for (const subsection of subsections) {
    // Build subsection ID based on whether we have a parent subsection
    let subsectionId: string;
    let subsectionQuestion: string;
    
    if (hasMultipleParagraphs && paragraphId !== null) {
      subsectionId = `${sectionId} วรรค ${paragraphId} อนุ ${subsection.id}`;
      subsectionQuestion = `${sectionPrefix} ${sectionNumber} วรรค ${paragraphId} อนุ ${subsection.id}`;
    } else {
      subsectionId = `${sectionId} อนุ ${subsection.id}`;
      subsectionQuestion = `${sectionPrefix} ${sectionNumber} อนุ ${subsection.id}`;
    }
    
    // Build the subsection answer
    const subsectionAnswerParts: string[] = [];
    subsectionAnswerParts.push(subsectionId);
    subsectionAnswerParts.push('');
    subsectionAnswerParts.push(subsection.content);
    
    // Add nested subsections to the answer if they exist
    if (subsection.subsections && subsection.subsections.length > 0) {
      const nestedLines = formatSubsectionsRecursive(subsection.subsections, 0);
      subsectionAnswerParts.push(...nestedLines);
    }
    
    const subsectionAnswer = subsectionAnswerParts.join('\n');
    
    // Add the subsection flashcard
    const subsectionCard: Flashcard = {
      id: subsectionId,
      question: subsectionQuestion,
      answer: subsectionAnswer,
    };
    if (dataSourceIndex !== undefined) {
      subsectionCard.dataSourceIndex = dataSourceIndex;
    }
    flashcards.push(subsectionCard);
    
    // Recursively process nested subsections
    if (subsection.subsections && subsection.subsections.length > 0) {
      const nestedFlashcards = generateSubsectionFlashcardsRecursive(
        subsection.subsections,
        sectionId,
        sectionNumber,
        paragraphId,
        hasMultipleParagraphs,
        dataSourceIndex,
        sectionPrefix
      );
      flashcards.push(...nestedFlashcards);
    }
  }
  
  return flashcards;
}

/**
 * Category ID to filename(s) mapping
 * Maps Thai category IDs to their corresponding JSON filename(s)
 * Supports three formats for backward compatibility:
 * 1. Single apiFilename string (legacy)
 * 2. Array of apiFilename strings
 * 3. dataSources array with paired apiFilename/filterFilename/descriptionApiPath (new format)
 * This mapping is loaded from the categories configuration file
 */
const CATEGORY_FILE_MAP: Record<string, string[]> = categoriesConfig.categories.filter(category => category.enabled).reduce(
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
 * @param dataSourceIndex - Optional data source index to preserve in generated flashcards
 * @param sectionPrefix - Optional prefix to use instead of "มาตรา" (e.g., "ข้อ")
 * @returns Array of flashcards
 */
function mapComplexToSimpleFormat(complexQuestion: ComplexQuestion, dataSourceIndex?: number, sectionPrefix: string = "มาตรา"): Flashcard[] {
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

    // Add subsections if they exist (using recursive formatting)
    if (paragraph.subsections && paragraph.subsections.length > 0) {
      const subsectionLines = formatSubsectionsRecursive(paragraph.subsections, 0);
      answerParts.push(...subsectionLines);
    }
  }

  const answer = answerParts.join("\n");

  // Add the whole section flashcard with title
  const wholeSection: Flashcard = {
    id: complexQuestion.id,
    question: question,
    answer: answer,
    title: complexQuestion.title, // Preserve title for display in section list
  };
  if (dataSourceIndex !== undefined) {
    wholeSection.dataSourceIndex = dataSourceIndex;
  }
  flashcards.push(wholeSection);

  // Extract section number from complexQuestion.id (e.g., "มาตรา 1" -> "1", "ข้อ 1" -> "1")
  const sectionNumber = complexQuestion.id.replace(`${sectionPrefix} `, "");

  // Create individual flashcards for each paragraph (if multiple paragraphs exist)
  if (complexQuestion.content.paragraphs.length > 1) {
    for (const paragraph of complexQuestion.content.paragraphs) {
      // Create paragraph ID and question
      const paragraphId = `${complexQuestion.id} วรรค ${paragraph.id}`;
      const paragraphQuestion = `${sectionPrefix} ${sectionNumber} วรรค ${paragraph.id}`;
      
      // Build the paragraph answer
      const paragraphAnswerParts: string[] = [];
      paragraphAnswerParts.push(paragraphId);
      paragraphAnswerParts.push("");
      paragraphAnswerParts.push(paragraph.content);
      
      // Add subsections if they exist (using recursive formatting)
      if (paragraph.subsections && paragraph.subsections.length > 0) {
        const subsectionLines = formatSubsectionsRecursive(paragraph.subsections, 0);
        paragraphAnswerParts.push(...subsectionLines);
      }
      
      const paragraphAnswer = paragraphAnswerParts.join("\n");
      
      // Add the paragraph flashcard
      const paragraphCard: Flashcard = {
        id: paragraphId,
        question: paragraphQuestion,
        answer: paragraphAnswer,
      };
      if (dataSourceIndex !== undefined) {
        paragraphCard.dataSourceIndex = dataSourceIndex;
      }
      flashcards.push(paragraphCard);
    }
  }

  // Now create individual flashcards for each subsection (including nested subsections)
  for (const paragraph of complexQuestion.content.paragraphs) {
    if (paragraph.subsections && paragraph.subsections.length > 0) {
      const hasMultipleParagraphs = complexQuestion.content.paragraphs.length > 1;
      const subsectionFlashcards = generateSubsectionFlashcardsRecursive(
        paragraph.subsections,
        complexQuestion.id,
        sectionNumber,
        hasMultipleParagraphs ? paragraph.id : null,
        hasMultipleParagraphs,
        dataSourceIndex,
        sectionPrefix
      );
      flashcards.push(...subsectionFlashcards);
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
        if (typeof subsection.id !== "string") {
          throw new Error("Invalid subsection structure: id must be a string");
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
      // Preserve dataSourceIndex and sectionPrefix if they exist
      // Read sectionPrefix from the raw object before validation narrows the type
      const rawQuestion = question as any;
      const dataSourceIndex = rawQuestion.dataSourceIndex as number | undefined;
      const sectionPrefix = rawQuestion.sectionPrefix as string | undefined;
      const simpleQuestions = mapComplexToSimpleFormat(question, dataSourceIndex, sectionPrefix);
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
  const categoryConfig = categoriesConfig.categories.filter(c => c.enabled).find(c => c.id === categoryId);

  // Fetch all API files and merge questions
  const allQuestions: any[] = [];
  
  for (let dataSourceIndex = 0; dataSourceIndex < filenames.length; dataSourceIndex++) {
    const filename = filenames[dataSourceIndex];
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
        // Tag each question with its data source index if this category has multiple data sources
        const hasMultipleDataSources = filenames.length > 1;
        // Resolve the sectionPrefix for this data source (if configured)
        const dataSourceConfig = categoryConfig?.dataSources?.[dataSourceIndex];
        const sectionPrefix = dataSourceConfig?.sectionPrefix;
        const questionsWithDataSourceIndex = hasMultipleDataSources
          ? questions.map(q => ({ ...q, dataSourceIndex, ...(sectionPrefix && { sectionPrefix }) }))
          : sectionPrefix
            ? questions.map(q => ({ ...q, sectionPrefix }))
            : questions;
        allQuestions.push(...questionsWithDataSourceIndex);
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
    nameTh: categoryConfig?.nameTh || categoryId,
    nameEn: categoryConfig?.nameEn || firstFilename
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    icon: categoryConfig?.icon || "📚",
    questions: allQuestions,
    // Preserve original metadata fields for proper routing and data source handling
    ...(categoryConfig?.apiFilename && { apiFilename: categoryConfig.apiFilename }),
    ...(categoryConfig?.filterFilename && { filterFilename: categoryConfig.filterFilename }),
    ...(categoryConfig?.descriptionApiPath && { descriptionApiPath: categoryConfig.descriptionApiPath }),
    ...(categoryConfig?.dataSources && { dataSources: categoryConfig.dataSources }),
  };

  validateCategory(category);
  return category;
}
