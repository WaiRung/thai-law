<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังโหลดหมวดหมู่..." />
        <template v-else>
            <!-- Warning Banner for Fallback -->
            <div v-if="error && isUsingFallback" class="warning-banner">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">{{ error }}</span>
            </div>

            <CategorySelection
                :categories="categoryList"
                @select="selectCategory"
            />
        </template>
    </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import CategorySelection from "../components/CategorySelection.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { categoryStores } from "../data/categoryStores";
import { filterQuestions } from "../services/filterService";
import { useDataManager } from "../composables/useDataManager";
import { useHeader } from "../composables/useHeader";
import type { CategoryStore } from "../types/flashcard";

const router = useRouter();
const { setHeader, resetHeader } = useHeader();

// Category Management
const categories = ref<CategoryStore[]>([]);
const filteredCounts = ref<Record<string, number>>({});
const isLoading = ref(false);
const error = ref<string | null>(null);
const isUsingFallback = ref(false);

// Use data manager composable
const { loadCategories } = useDataManager();

// Build category list from loaded categories
const categoryList = computed(() =>
    categories.value.map((store) => ({
        id: store.id,
        nameTh: store.nameTh,
        nameEn: store.nameEn,
        icon: store.icon,
        count: filteredCounts.value[store.id] ?? 0,
    })),
);

// Load categories on component mount
const loadCategoriesData = async () => {
    isLoading.value = true;
    error.value = null;
    isUsingFallback.value = false;

    try {
        // Use the composable to load categories
        const loadedCategories = await loadCategories();
        
        if (loadedCategories) {
            categories.value = loadedCategories;
        } else {
            // Fall back to static data if loading fails
            console.warn("Using static data as fallback");
            categories.value = categoryStores;
            isUsingFallback.value = true;
            error.value = "ไม่สามารถโหลดข้อมูลจาก API ได้ กำลังใช้ข้อมูลแบบออฟไลน์";
            
            // Clear error after 5 seconds
            setTimeout(() => {
                error.value = null;
            }, 5000);
        }
    } catch (err) {
        // Fall back to static data if API fails
        console.warn("Failed to load categories, using static data:", err);
        categories.value = categoryStores;
        isUsingFallback.value = true;
        error.value = "ไม่สามารถโหลดข้อมูลจาก API ได้ กำลังใช้ข้อมูลแบบออฟไลน์";
        
        setTimeout(() => {
            error.value = null;
        }, 5000);
    } finally {
        isLoading.value = false;
    }
};

// Category Selection Method
const selectCategory = (categoryId: string) => {
    // Navigate to quiz view using router
    router.push({ name: "quizlaw", params: { categoryId } });
};

// Initialize categories on mount
onMounted(async () => {
    // Set header to indicate QuizLaw mode
    setHeader("QuizLaw", "เลือกหมวดหมู่");

    // Load categories
    await loadCategoriesData();
    
    // Calculate filtered counts for each category
    await Promise.all(categories.value.map(async (store) => {
        const filtered = await filterQuestions(store.id, store.questions);
        filteredCounts.value[store.id] = filtered.length;
    }));
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

.warning-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background-color: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    color: #92400e;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.warning-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.warning-text {
    font-size: 0.875rem;
    font-weight: 500;
    flex: 1;
}

@media (max-width: 640px) {
    .main-content {
        padding: 1rem 0.75rem;
    }
}
</style>
