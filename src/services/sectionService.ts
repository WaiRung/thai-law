import type { QuestionFilter, Flashcard } from "../types/flashcard";
import { categoryStores } from "../data/categoryStores";

// Import all filter files
import criminalFilter from "../filters/criminal/criminal.json";
import civilFilter from "../filters/civil/civil.json";
import loanFilter from "../filters/civil/loan.json";
import criminal2Filter from "../filters/criminal/criminal_2.json";
import paragraphExampleFilter from "../filters/civil/paragraph-example.json";

interface SectionContent {
    id: string;
    question: string;
    answer: string;
}

interface CategorySectionsWithContent {
    categoryId: string;
    categoryName: string;
    sections: SectionContent[];
}

// Map of all available filters
const allFilters: QuestionFilter[] = [
    criminalFilter,
    civilFilter,
    loanFilter,
    criminal2Filter,
    paragraphExampleFilter,
];

/**
 * Get all sections from all filters, grouped by category with full content
 * @returns Promise with array of CategorySectionsWithContent
 */
export async function getAllSections(): Promise<CategorySectionsWithContent[]> {
    const categorySections: CategorySectionsWithContent[] = [];

    for (const filter of allFilters) {
        if (filter.allowedQuestionIds && filter.allowedQuestionIds.length > 0) {
            // Find the corresponding category store
            const categoryStore = categoryStores.find(
                (store) => store.id === filter.categoryId
            );

            if (!categoryStore) {
                console.warn(`Category store not found for: ${filter.categoryId}`);
                continue;
            }

            // Create a map of question IDs to flashcard data for quick lookup
            const questionMap = new Map<string, Flashcard>();
            categoryStore.questions.forEach((q) => {
                questionMap.set(q.id, q);
            });

            // Get section content for allowed question IDs
            const sectionsWithContent: SectionContent[] = [];
            const sortedSectionIds = [...filter.allowedQuestionIds].sort((a, b) => {
                // Sort sections numerically by extracting the section number
                const extractNumber = (str: string) => {
                    const match = str.match(/มาตรา\s+(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                };
                return extractNumber(a) - extractNumber(b);
            });

            for (const sectionId of sortedSectionIds) {
                const flashcard = questionMap.get(sectionId);
                if (flashcard) {
                    sectionsWithContent.push({
                        id: flashcard.id,
                        question: flashcard.question,
                        answer: flashcard.answer,
                    });
                } else {
                    // If no content found, just show the ID
                    sectionsWithContent.push({
                        id: sectionId,
                        question: sectionId,
                        answer: "เนื้อหายังไม่มีในระบบ",
                    });
                }
            }

            categorySections.push({
                categoryId: filter.categoryId,
                categoryName: filter.categoryId,
                sections: sectionsWithContent,
            });
        }
    }

    return categorySections;
}

/**
 * Get sections for a specific category
 * @param categoryId - The category ID to get sections for
 * @returns Promise with array of section IDs
 */
export async function getCategorySections(
    categoryId: string,
): Promise<string[]> {
    const filter = allFilters.find((f) => f.categoryId === categoryId);
    if (!filter || !filter.allowedQuestionIds) {
        return [];
    }

    return [...filter.allowedQuestionIds].sort((a, b) => {
        // Sort sections numerically by extracting the section number
        const extractNumber = (str: string) => {
            const match = str.match(/มาตรา\s+(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        };
        return extractNumber(a) - extractNumber(b);
    });
}

/**
 * Get total count of sections across all categories
 * @returns Total number of sections
 */
export function getTotalSectionsCount(): number {
    return allFilters.reduce(
        (total, filter) => total + (filter.allowedQuestionIds?.length || 0),
        0,
    );
}
