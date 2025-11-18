import type { QuestionFilter } from "../types/flashcard";

// Import all filter files
import criminalFilter from "../filters/criminal/criminal.json";
import civilFilter from "../filters/civil/civil.json";
import loanFilter from "../filters/civil/loan.json";
import criminal2Filter from "../filters/criminal/criminal_2.json";
import paragraphExampleFilter from "../filters/civil/paragraph-example.json";

interface CategorySections {
    categoryId: string;
    categoryName: string;
    sections: string[];
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
 * Get all sections from all filters, grouped by category
 * @returns Promise with array of CategorySections
 */
export async function getAllSections(): Promise<CategorySections[]> {
    const categorySections: CategorySections[] = [];

    for (const filter of allFilters) {
        if (filter.allowedQuestionIds && filter.allowedQuestionIds.length > 0) {
            categorySections.push({
                categoryId: filter.categoryId,
                categoryName: filter.categoryId, // Using categoryId as name for now
                sections: [...filter.allowedQuestionIds].sort((a, b) => {
                    // Sort sections numerically by extracting the section number
                    const extractNumber = (str: string) => {
                        const match = str.match(/มาตรา\s+(\d+)/);
                        return match ? parseInt(match[1], 10) : 0;
                    };
                    return extractNumber(a) - extractNumber(b);
                }),
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
