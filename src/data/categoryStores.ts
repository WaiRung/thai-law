import type { CategoryStore, Flashcard } from "../types/flashcard";
import categoriesConfig from "../config/categories.json";

/**
 * Complex format interfaces for static data transformation
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
 * @param sectionId - Section ID (e.g., "มาตรา 1" or "ข้อ 1")
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
 * Map complex format to simple flashcard format
 * Same logic as in api.ts to ensure consistency
 */
function mapComplexToSimpleFormat(complexQuestion: ComplexQuestion, dataSourceIndex?: number, sectionPrefix: string = "มาตรา"): Flashcard[] {
  const flashcards: Flashcard[] = [];

  // First, create the whole section flashcard
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
 * Transform categories with complex format questions
 */
function transformCategories(categories: any[]): CategoryStore[] {
  return categories.map(category => {
    const transformedQuestions: Flashcard[] = [];
    
    for (const question of category.questions) {
      // Check if question is in complex format (has title and content)
      if (question.title !== undefined && question.content !== undefined) {
        // Map complex format to simple format (returns array)
        // Preserve dataSourceIndex and sectionPrefix if they exist
        const dataSourceIndex = (question as any).dataSourceIndex;
        const sectionPrefix = (question as any).sectionPrefix as string | undefined;
        const simpleQuestions = mapComplexToSimpleFormat(question as ComplexQuestion, dataSourceIndex, sectionPrefix);
        transformedQuestions.push(...simpleQuestions);
      } else {
        // Already in simple format, just use as is
        transformedQuestions.push(question as Flashcard);
      }
    }
    
    return {
      ...category,
      questions: transformedQuestions,
    } as CategoryStore;
  });
}

/**
 * Category stores loaded from JSON configuration file
 * This makes it easy to maintain and update categories without modifying code
 * Complex format questions are transformed to simple format
 */
export const categoryStores: CategoryStore[] = transformCategories(categoriesConfig.categories.filter(category => category.enabled));
