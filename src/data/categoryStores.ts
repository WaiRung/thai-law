import type { CategoryStore } from "../types/flashcard";
import categoriesConfig from "../config/categories.json";

/**
 * Category stores loaded from JSON configuration file
 * This makes it easy to maintain and update categories without modifying code
 */
export const categoryStores: CategoryStore[] = categoriesConfig.categories;
