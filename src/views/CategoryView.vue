<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังโหลดหมวดหมู่..." />
        <template v-else>
            <!-- Warning Banner for Fallback -->
            <div v-if="error && isUsingFallback" class="warning-banner">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">{{ error }}</span>
            </div>

            <!-- Cache Status Section -->
            <CacheStatus
                :is-cache-available="isCacheAvailable"
                :cache-metadata="cacheMetadata"
                :is-downloading="isDownloading"
                :download-success="downloadSuccess"
                @reload="reloadData"
            />

            <CategorySelection
                :categories="categoryList"
                @select="selectCategory"
            />
        </template>
    </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import CategorySelection from "../components/CategorySelection.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import CacheStatus from "../components/CacheStatus.vue";
import { categoryStores } from "../data/categoryStores";
import { fetchCategories } from "../services/api";
import { filterQuestions } from "../services/filterService";
import {
    getCategoriesCache,
    saveCategoriesCache,
    getCacheMetadata,
    clearCache,
    isCacheValid,
} from "../services/cache";
import type { CategoryStore, CacheMetadata } from "../types/flashcard";

const router = useRouter();

// Category Management
const categories = ref<CategoryStore[]>([]);
const filteredCounts = ref<Record<string, number>>({});
const isLoading = ref(false);
const error = ref<string | null>(null);
const isUsingFallback = ref(false);

// Cache Management
const isCacheAvailable = ref(false);
const cacheMetadata = ref<CacheMetadata | null>(null);
const isDownloading = ref(false);
const downloadSuccess = ref(false);

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
const loadCategories = async () => {
    isLoading.value = true;
    error.value = null;
    isUsingFallback.value = false;

    try {
        // First, check IndexedDB cache and validate it
        const cachedCategories = await getCategoriesCache();
        const cacheIsValid = await isCacheValid();

        if (cachedCategories && cachedCategories.length > 0 && cacheIsValid) {
            // Cache exists and is valid, load from cache instantly
            console.log("Loading categories from cache");
            categories.value = cachedCategories;
            isCacheAvailable.value = true;
            isLoading.value = false;
            return;
        }

        // Cache is stale or doesn't exist, try to refresh from API
        if (cachedCategories && !cacheIsValid) {
            console.log("Cache is stale, refreshing from API");
        }

        // No cache exists, try to fetch from API
        console.log("No cache found, fetching from API");
        const apiCategories = await fetchCategories();
        categories.value = apiCategories;

        for (const store of categories.value) {
            const filtered = await filterQuestions(store.id, store.questions);
            filteredCounts.value[store.id] = filtered.length;

            console.log("Loaded count for", store.id, ":", filtered.length);
        }

        // Automatically save to cache on successful API fetch
        await saveCategoriesCache(apiCategories);

        // Update cache metadata
        const metadata = await getCacheMetadata();
        cacheMetadata.value = metadata;
        isCacheAvailable.value = true;
    } catch (err) {
        // Fall back to static data if API fails
        console.warn(
            "Failed to load categories from API, using static data:",
            err,
        );
        categories.value = categoryStores;
        isUsingFallback.value = true;

        // Set a user-friendly message if API was expected but failed
        const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
        if (!errorMessage.includes("not configured")) {
            error.value =
                "ไม่สามารถโหลดข้อมูลจาก API ได้ กำลังใช้ข้อมูลแบบออฟไลน์";
            // Clear error after 5 seconds so user can continue
            setTimeout(() => {
                error.value = null;
            }, 5000);
        }
    } finally {
        isLoading.value = false;
    }
};

// Reload data - clear old cache and fetch fresh data
const reloadData = async () => {
    isDownloading.value = true;
    downloadSuccess.value = false;
    error.value = null;

    try {
        // Clear old cache first (if exists)
        if (isCacheAvailable.value) {
            console.log("Clearing old cache...");
            await clearCache();
        }

        // Force fetch from API
        console.log("Fetching fresh data from API...");
        const apiCategories = await fetchCategories();

        // Save to IndexedDB on success
        await saveCategoriesCache(apiCategories);

        // Update categories and cache metadata
        categories.value = apiCategories;
        const metadata = await getCacheMetadata();
        cacheMetadata.value = metadata;
        isCacheAvailable.value = true;

        // Show success message for 5 seconds
        downloadSuccess.value = true;
        setTimeout(() => {
            downloadSuccess.value = false;
        }, 5000);

        console.log("Data reloaded and cached successfully");
    } catch (err) {
        console.error("Failed to reload data:", err);
        const errorMessage =
            err instanceof Error ? err.message : "Unknown error";

        if (errorMessage.includes("not configured")) {
            error.value = "API ไม่ได้ถูกกำหนดค่า ไม่สามารถโหลดข้อมูลได้";
        } else {
            error.value =
                "ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
        }

        setTimeout(() => {
            error.value = null;
        }, 5000);
    } finally {
        isDownloading.value = false;
    }
};

// Category Selection Method
const selectCategory = (categoryId: string) => {
    // Navigate to flashcard view using router
    router.push({ name: "flashcards", params: { categoryId } });
};

// Initialize categories on mount
onMounted(async () => {
    // Load cache metadata
    const metadata = await getCacheMetadata();
    if (metadata) {
        cacheMetadata.value = metadata;
        isCacheAvailable.value = true;
    }

    // Load categories
    await loadCategories();
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
