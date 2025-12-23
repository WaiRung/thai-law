/**
 * Quiz Service
 * Generates quiz questions from flashcard data
 * 
 * Quiz rules:
 * 1. Questions are content without "มาตรา", "วรรค", "อนุ"
 * 2. Answers are 4 choices:
 *    - Whole section: "มาตรา {4 nearest section numbers}"
 *    - Paragraph: "มาตรา X วรรค {other paragraph numbers}"
 *    - Subsection: "มาตรา X อนุ {1 correct + 3 random nearest numbers}"
 */

import type { Flashcard } from "../types/flashcard";
import type { QuizQuestion } from "../types/quiz";

/**
 * Parse section ID to extract section number, paragraph number, and subsection number
 * Examples:
 * - "มาตรา 123" -> { section: 123 }
 * - "มาตรา 123 วรรค 2" -> { section: 123, paragraph: 2 }
 * - "มาตรา 123 อนุ 3" -> { section: 123, subsection: 3 }
 * - "มาตรา 123 วรรค 2 อนุ 3" -> { section: 123, paragraph: 2, subsection: 3 }
 */
interface ParsedId {
  section: number;
  paragraph?: number;
  subsection?: string;
}

function parseFlashcardId(id: string): ParsedId | null {
  // Match patterns like "มาตรา 123", "มาตรา 123 วรรค 2", etc.
  const sectionMatch = id.match(/มาตรา\s+(\d+)/);
  if (!sectionMatch) return null;

  const section = parseInt(sectionMatch[1], 10);
  const result: ParsedId = { section };

  // Check for paragraph
  const paragraphMatch = id.match(/วรรค\s+(\d+)/);
  if (paragraphMatch) {
    result.paragraph = parseInt(paragraphMatch[1], 10);
  }

  // Check for subsection
  const subsectionMatch = id.match(/อนุ\s+(.+?)(?:\s|$)/);
  if (subsectionMatch) {
    result.subsection = subsectionMatch[1].trim();
  }

  return result;
}

/**
 * Extract question content from flashcard answer
 * Removes the header (มาตรา X, etc.) and returns only the content
 */
function extractQuestionContent(flashcard: Flashcard): string {
  // The answer format is:
  // First line: "มาตรา X" or "มาตรา X วรรค Y" etc.
  // Following lines: The actual content
  const lines = flashcard.answer.split("\n");
  
  // Skip first line (section/paragraph header) and empty lines
  const contentLines = lines.slice(1).filter(line => line.trim() !== "");
  
  // Join content lines and trim
  let content = contentLines.join("\n").trim();
  
  // Remove leading paragraph markers like "วรรค X" or subsection markers
  content = content.replace(/^\s*วรรค\s+\d+\s*/, "").trim();
  
  return content;
}

/**
 * Get the 4 nearest section numbers to the target section
 */
function getNearestSectionChoices(
  targetSection: number,
  allSections: number[],
  count: number = 4
): number[] {
  // Sort sections by distance from target
  const sortedByDistance = [...allSections]
    .filter(s => s !== targetSection) // Exclude target
    .sort((a, b) => Math.abs(a - targetSection) - Math.abs(b - targetSection));
  
  // Take nearest (count - 1) sections and add target
  const nearestSections = sortedByDistance.slice(0, count - 1);
  nearestSections.push(targetSection);
  
  // Shuffle the choices
  return shuffleArray(nearestSections);
}

/**
 * Get paragraph choices for a section
 */
function getParagraphChoices(
  targetParagraph: number,
  targetSection: number,
  allParagraphs: number[],
  allSections: number[]
): string[] {
  const choices: string[] = [];
  
  // Add the correct answer
  choices.push(`มาตรา ${targetSection} วรรค ${targetParagraph}`);
  
  // Get other paragraphs from the same section
  const otherParagraphs = allParagraphs.filter(p => p !== targetParagraph);
  
  // Add other paragraph choices
  for (const p of otherParagraphs.slice(0, 3)) {
    choices.push(`มาตรา ${targetSection} วรรค ${p}`);
  }
  
  // If we don't have enough paragraph choices, add section choices
  if (choices.length < 4) {
    const nearestSections = allSections
      .filter(s => s !== targetSection)
      .sort((a, b) => Math.abs(a - targetSection) - Math.abs(b - targetSection));
    
    for (const s of nearestSections) {
      if (choices.length >= 4) break;
      choices.push(`มาตรา ${s}`);
    }
  }
  
  return shuffleArray(choices);
}

/**
 * Get subsection choices
 */
function getSubsectionChoices(
  targetSubsection: string,
  targetSection: number,
  targetParagraph: number | undefined,
  allSubsections: string[]
): string[] {
  const choices: string[] = [];
  
  // Build the correct answer format
  const correctAnswer = targetParagraph !== undefined
    ? `มาตรา ${targetSection} วรรค ${targetParagraph} อนุ ${targetSubsection}`
    : `มาตรา ${targetSection} อนุ ${targetSubsection}`;
  
  choices.push(correctAnswer);
  
  // Get other subsection strings (filter out the target)
  const otherSubsections = allSubsections.filter(s => s !== targetSubsection);
  
  // Try to sort numerically if possible, otherwise keep original order
  const sortedSubsections = [...otherSubsections].sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    // If both are numeric, sort by numeric distance from target
    if (!isNaN(numA) && !isNaN(numB)) {
      const targetNum = parseFloat(targetSubsection);
      if (!isNaN(targetNum)) {
        return Math.abs(numA - targetNum) - Math.abs(numB - targetNum);
      }
      return numA - numB;
    }
    
    // Otherwise, use string comparison
    return a.localeCompare(b);
  });
  
  // If we don't have enough subsections, generate some random ones nearby
  const neededCount = 3;
  const availableSubsections = [...sortedSubsections];
  
  // Add random nearby numbers if not enough (with safety counter to prevent infinite loop)
  // Only generate if target is numeric
  const targetNum = parseFloat(targetSubsection);
  if (!isNaN(targetNum)) {
    let attempts = 0;
    const maxAttempts = 50;
    while (availableSubsections.length < neededCount && attempts < maxAttempts) {
      attempts++;
      const randomOffset = Math.floor(Math.random() * 10) + 1;
      const randomNum = targetNum + (Math.random() > 0.5 ? randomOffset : -randomOffset);
      const randomStr = Math.round(randomNum).toString();
      if (randomNum > 0 && !availableSubsections.includes(randomStr) && randomStr !== targetSubsection) {
        availableSubsections.push(randomStr);
      }
    }
  }
  
  // Add wrong choices
  for (let i = 0; i < neededCount && i < availableSubsections.length; i++) {
    const wrongSubsection = availableSubsections[i];
    const wrongAnswer = targetParagraph !== undefined
      ? `มาตรา ${targetSection} วรรค ${targetParagraph} อนุ ${wrongSubsection}`
      : `มาตรา ${targetSection} อนุ ${wrongSubsection}`;
    choices.push(wrongAnswer);
  }
  
  return shuffleArray(choices);
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Weight multipliers for different question types
 * Whole section questions have slightly more weight than subsection questions
 */
const WEIGHT_SECTION = 1.5;      // Whole section questions (มาตรา X)
const WEIGHT_PARAGRAPH = 1.2;   // Paragraph questions (มาตรา X วรรค Y)
const WEIGHT_SUBSECTION = 1.0;  // Subsection questions (มาตรา X อนุ Z)

/**
 * Get the weight for a parsed card based on its type
 */
function getCardWeight(parsed: ParsedId): number {
  if (parsed.subsection !== undefined) {
    return WEIGHT_SUBSECTION;
  } else if (parsed.paragraph !== undefined) {
    return WEIGHT_PARAGRAPH;
  } else {
    return WEIGHT_SECTION;
  }
}

/**
 * Select items from an array using weighted random selection
 * Items with higher weights are more likely to be selected
 */
function weightedRandomSelect<T>(
  items: { item: T; weight: number }[],
  count: number
): T[] {
  const selected: T[] = [];
  const remaining = [...items];
  
  while (selected.length < count && remaining.length > 0) {
    // Calculate total weight
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    
    // Generate a random value in the range [0, totalWeight)
    const random = Math.random() * totalWeight;
    
    // Find the item that corresponds to this random value
    let cumulative = 0;
    let selectedIndex = remaining.length - 1; // Default to last item for edge cases
    for (let i = 0; i < remaining.length; i++) {
      cumulative += remaining[i].weight;
      if (random < cumulative) {
        selectedIndex = i;
        break;
      }
    }
    
    // Add the selected item and remove it from remaining
    selected.push(remaining[selectedIndex].item);
    remaining.splice(selectedIndex, 1);
  }
  
  return selected;
}

/**
 * Generate quiz questions from flashcards
 * @param flashcards - Array of flashcards to generate questions from
 * @param count - Number of questions to generate (default: 20)
 * @returns Array of quiz questions
 */
export function generateQuizQuestions(
  flashcards: Flashcard[],
  count: number = 20
): QuizQuestion[] {
  // Parse all flashcard IDs to understand the structure
  const parsedCards: { card: Flashcard; parsed: ParsedId }[] = [];
  
  for (const card of flashcards) {
    const parsed = parseFlashcardId(card.id);
    if (parsed) {
      parsedCards.push({ card, parsed });
    }
  }
  
  if (parsedCards.length === 0) {
    return [];
  }
  
  // Extract unique sections, paragraphs, and subsections for choice generation
  const allSections = [...new Set(parsedCards.map(p => p.parsed.section))].sort((a, b) => a - b);
  
  // Create weighted items for selection
  // Whole section questions have slightly more weight than subsection questions
  const weightedCards = parsedCards.map(cardData => ({
    item: cardData,
    weight: getCardWeight(cardData.parsed)
  }));
  
  // Use weighted random selection to pick cards
  const selectedCards = weightedRandomSelect(weightedCards, count);
  
  const questions: QuizQuestion[] = [];
  
  for (const { card, parsed } of selectedCards) {
    // Determine question type
    let type: 'section' | 'paragraph' | 'subsection';
    let correctAnswer: string;
    let choices: string[];
    
    if (parsed.subsection !== undefined) {
      // Subsection question
      type = 'subsection';
      correctAnswer = parsed.paragraph !== undefined
        ? `มาตรา ${parsed.section} วรรค ${parsed.paragraph} อนุ ${parsed.subsection}`
        : `มาตรา ${parsed.section} อนุ ${parsed.subsection}`;
      
      // Get all subsections for this section (or section+paragraph)
      const relevantCards = parsedCards.filter(p => 
        p.parsed.section === parsed.section && 
        p.parsed.paragraph === parsed.paragraph &&
        p.parsed.subsection !== undefined
      );
      const allSubsections = [...new Set(relevantCards.map(p => p.parsed.subsection!))];
      
      choices = getSubsectionChoices(
        parsed.subsection,
        parsed.section,
        parsed.paragraph,
        allSubsections
      );
    } else if (parsed.paragraph !== undefined) {
      // Paragraph question
      type = 'paragraph';
      correctAnswer = `มาตรา ${parsed.section} วรรค ${parsed.paragraph}`;
      
      // Get all paragraphs for this section
      const relevantCards = parsedCards.filter(p => 
        p.parsed.section === parsed.section &&
        p.parsed.paragraph !== undefined &&
        p.parsed.subsection === undefined
      );
      const allParagraphs = [...new Set(relevantCards.map(p => p.parsed.paragraph!))].sort((a, b) => a - b);
      
      choices = getParagraphChoices(
        parsed.paragraph,
        parsed.section,
        allParagraphs,
        allSections
      );
    } else {
      // Whole section question
      type = 'section';
      correctAnswer = `มาตรา ${parsed.section}`;
      
      const sectionChoices = getNearestSectionChoices(parsed.section, allSections);
      choices = sectionChoices.map(s => `มาตรา ${s}`);
    }
    
    // Extract question content
    const questionContent = extractQuestionContent(card);
    
    questions.push({
      id: card.id,
      question: questionContent,
      correctAnswer,
      choices,
      type,
    });
  }
  
  return questions;
}
