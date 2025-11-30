<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังโหลดหมวดหมู่..." />
        <template v-else>
            <div class="sections-container">
                <div class="header-section">
                    <h2 class="title">เลือกหมวดกฎหมาย</h2>
                    <p class="subtitle">Select Law Category for Sections</p>
                </div>

                <div class="categories-list">
                    <button
                        v-for="category in categoriesWithSections"
                        :key="category.categoryId"
                        @click="selectCategory(category.categoryId)"
                        class="category-item"
                    >
                        <div class="category-icon">📜</div>
                        <div class="category-content">
                            <div class="category-name">{{ category.categoryName }}</div>
                            <div class="category-count">{{ category.sectionCount }} มาตรา</div>
                        </div>
                        <div class="category-arrow">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                class="arrow-icon"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </div>
                    </button>
                </div>

                <div v-if="categoriesWithSections.length === 0" class="empty-state">
                    <p>ไม่พบข้อมูลหมวดหมู่</p>
                </div>
            </div>
        </template>
    </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { getAllSections } from "../services/sectionService";
import { categoryStores } from "../data/categoryStores";
import { fetchCategories } from "../services/api";
import {
    getCategoriesCache,
    isCacheValid,
} from "../services/cache";
import { useHeader } from "../composables/useHeader";
import type { CategoryStore } from "../types/flashcard";

interface CategoryWithSectionCount {
    categoryId: string;
    categoryName: string;
    sectionCount: number;
}

const router = useRouter();
const { setHeader, resetHeader } = useHeader();
const isLoading = ref(true);
const categoriesWithSections = ref<CategoryWithSectionCount[]>([]);
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

const loadCategoriesWithSections = async () => {
    isLoading.value = true;
    try {
        // Load categories first
        await loadCategories();
        
        // Get all sections to count them per category
        const allSections = await getAllSections(categories.value);
        
        // Build category list with section counts
        categoriesWithSections.value = allSections.map(cat => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            sectionCount: cat.sections.length,
        }));
    } catch (error) {
        console.error("Failed to load categories:", error);
    } finally {
        isLoading.value = false;
    }
};

const selectCategory = (categoryId: string) => {
    router.push({ name: "sections-detail", params: { categoryId } });
};

onMounted(() => {
    // Set header to indicate Sections mode
    setHeader("รายการมาตรา", "Sections List");
    
    loadCategoriesWithSections();
});

// Reset header on unmount
onUnmounted(() => {
    resetHeader();
});
</script>

<style scoped>
.main-content {
    flex: 1;
    padding: 1.5rem 1rem;
    max-width: 600px;
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

.categories-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.category-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
}

.category-item:hover {
    background: #f9fafb;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.category-item:active {
    transform: translateY(0);
}

.category-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
}

.category-content {
    flex: 1;
}

.category-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
}

.category-count {
    font-size: 0.875rem;
    color: #6b7280;
}

.category-arrow {
    flex-shrink: 0;
}

.arrow-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #9ca3af;
    transition: all 0.2s;
}

.category-item:hover .arrow-icon {
    color: #3b82f6;
    transform: translateX(4px);
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

    .category-item {
        padding: 1.25rem;
    }

    .category-icon {
        font-size: 2rem;
    }

    .category-name {
        font-size: 1.125rem;
    }

    .category-count {
        font-size: 0.8125rem;
    }
}
</style>
