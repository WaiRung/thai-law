/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Type definitions for categories.json config structure
declare module '../config/categories.json' {
  /**
   * Represents a paired data source for a category
   * Allows combining API data, filters, and descriptions from multiple sources
   */
  export interface DataSource {
    /** API filename (without .json extension) for fetching question data */
    apiFilename?: string;
    /** Filter file path (relative to src/filters/) for allowed question IDs */
    filterFilename?: string;
    /** Description API path for fetching section descriptions */
    descriptionApiPath?: string;
  }

  export interface CategoryConfig {
    id: string;
    nameTh: string;
    nameEn: string;
    icon: string;
    // Legacy fields (backward compatible)
    apiFilename?: string | string[];
    filterFilename?: string | string[];
    descriptionApiPath?: string | string[];
    // New format with paired data sources
    dataSources?: DataSource[];
    questions: any[];
  }

  export interface CategoriesConfig {
    categories: CategoryConfig[];
  }

  const config: CategoriesConfig;
  export default config;
}
