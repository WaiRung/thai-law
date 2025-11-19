<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังโหลดรายการมาตรา..." />
        <template v-else>
            <div class="sections-container">
                <div class="header-section">
                    <h2 class="title">รายการมาตรา</h2>
                    <p class="subtitle">Sections List</p>
                </div>

                <div
                    v-for="category in categorySections"
                    :key="category.categoryId"
                    class="category-section"
                >
                    <h3 class="category-title">{{ category.categoryName }}</h3>
                    <div class="sections-list">
                        <div
                            v-for="section in category.sections"
                            :key="section.id"
                            class="section-item"
                        >
                            <div class="section-header">{{ section.id }}</div>
                            <div v-if="section.title && !section.id.includes('อนุ')" class="section-title">
                                {{ section.title }}
                            </div>
                            <div class="section-answer">{{ section.answer }}</div>
                        </div>
                    </div>
                </div>

                <div v-if="categorySections.length === 0" class="empty-state">
                    <p>ไม่พบข้อมูลมาตรา</p>
                </div>
            </div>
        </template>
    </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { getAllSections } from "../services/sectionService";
import { categoryStores } from "../data/categoryStores";
import { fetchCategories } from "../services/api";
import {
    getCategoriesCache,
    isCacheValid,
} from "../services/cache";
import type { CategoryStore } from "../types/flashcard";

interface SectionContent {
    id: string;
    question: string;
    answer: string;
    title?: string; // Optional title for whole sections
}

interface CategorySections {
    categoryId: string;
    categoryName: string;
    sections: SectionContent[];
}

// Accept categoryId as a prop
const props = defineProps<{
    categoryId: string;
}>();

const isLoading = ref(true);
const categorySections = ref<CategorySections[]>([]);
const categories = ref<CategoryStore[]>([]);

// Load categories from cache or fallback to static data
const loadCategories = async () => {
    try {
        // First, try to load from cache
        const cachedCategories = await getCategoriesCache();
        const cacheIsValid = await isCacheValid();

        if (cachedCategories && cachedCategories.length > 0 && cacheIsValid) {
            categories.value = cachedCategories;
            return;
        }

        // Try to fetch from API
        const apiCategories = await fetchCategories();
        categories.value = apiCategories;
    } catch (err) {
        // Fall back to static data
        console.warn("Failed to load categories, using static data:", err);
        categories.value = categoryStores;
    }
};

const loadSections = async () => {
    isLoading.value = true;
    try {
        // Load categories first
        await loadCategories();
        // Pass categories to getAllSections
        const allSections = await getAllSections(categories.value);
        // Filter to only show the selected category
        categorySections.value = allSections.filter(
            cat => cat.categoryId === props.categoryId
        );
    } catch (error) {
        console.error("Failed to load sections:", error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadSections();
});
</script>

<style scoped>
.main-content {
    flex: 1;
    padding: 1.5rem 1rem;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

.sections-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.header-section {
    text-align: center;
    padding: 1rem 0;
}

.title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
}

.subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
}

.category-section {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.5rem;
}

.category-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;
}

.sections-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.section-item {
    padding: 1.5rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    transition: all 0.2s;
}

.section-item:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.section-header {
    font-size: 1rem;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 0.75rem;
}

.section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #059669;
    margin-bottom: 0.75rem;
    padding: 0.5rem;
    background: #f0fdf4;
    border-left: 4px solid #059669;
    border-radius: 0.25rem;
}

.section-answer {
    font-size: 0.875rem;
    color: #1f2937;
    line-height: 1.8;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
    font-size: 1rem;
}

@media (max-width: 640px) {
    .main-content {
        padding: 1rem 0.75rem;
    }

    .title {
        font-size: 1.5rem;
    }

    .subtitle {
        font-size: 1rem;
    }

    .category-section {
        padding: 1rem;
    }

    .sections-list {
        gap: 1rem;
    }

    .section-item {
        padding: 1rem;
        font-size: 0.8125rem;
    }

    .section-header {
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .section-title {
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
        padding: 0.375rem;
    }

    .section-answer {
        font-size: 0.8125rem;
    }
}
</style>
