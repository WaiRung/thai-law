/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Type definitions for categories.json config structure
declare module '../config/categories.json' {
  export interface DataSource {
    apiFilename?: string;
    filterFilename?: string;
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
