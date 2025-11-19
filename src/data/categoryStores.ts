import type { CategoryStore, Flashcard } from "../types/flashcard";
import categoriesConfig from "../config/categories.json";

/**
 * Complex format interfaces for static data transformation
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
 * Map complex format to simple flashcard format
 * Same logic as in api.ts to ensure consistency
 */
function mapComplexToSimpleFormat(complexQuestion: ComplexQuestion): Flashcard[] {
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
 * Transform categories with complex format questions
 */
function transformCategories(categories: any[]): CategoryStore[] {
  return categories.map(category => {
    const transformedQuestions: Flashcard[] = [];
    
    for (const question of category.questions) {
      // Check if question is in complex format (has title and content)
      if (question.title !== undefined && question.content !== undefined) {
        // Map complex format to simple format (returns array)
        const simpleQuestions = mapComplexToSimpleFormat(question as ComplexQuestion);
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
export const categoryStores: CategoryStore[] = transformCategories(categoriesConfig.categories);
