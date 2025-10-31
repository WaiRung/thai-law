<template>
    <div class="app-container">
        <!-- Header -->
        <AppHeader
            :show-back-button="!!selectedCategory"
            @back="backToCategories"
        />

        <!-- Main Content -->
        <main class="main-content" v-if="!selectedCategory">
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

        <main class="main-content" v-else ref="flashcardViewRef">
            <!-- Progress Bar -->
            <ProgressBar
                :current-index="currentIndex"
                :total-cards="totalCards"
                :completed-count="completedCards.size"
            />

            <!-- Flashcard -->
            <div class="flashcard-wrapper">
                <FlashCard
                    :card="currentCard"
                    :isFlipped="isFlipped"
                    @flip="toggleFlip"
                />
            </div>

            <!-- Controls -->
            <FlashcardControls
                :current-index="currentIndex"
                :total-cards="totalCards"
                @previous="previousCard"
                @next="nextCard"
                @shuffle="shuffleCards"
                @reset="resetProgress"
            />
        </main>

        <!-- Footer -->
        <footer class="app-footer">
            <p>สำนักกฎหมายธนธรรม ทนายธาตรี ธนธรรมสุนทร เฟซจริง</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import FlashCard from "./components/FlashCard.vue";
import CategorySelection from "./components/CategorySelection.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import AppHeader from "./components/AppHeader.vue";
import CacheStatus from "./components/CacheStatus.vue";
import ProgressBar from "./components/ProgressBar.vue";
import FlashcardControls from "./components/FlashcardControls.vue";
import { categoryStores } from "./data/categoryStores";
import { fetchCategories } from "./services/api";
import {
    getCategoriesCache,
    saveCategoriesCache,
    getCacheMetadata,
    clearCache,
    isCacheValid,
} from "./services/cache";
import type {
    Flashcard,
    CategoryStore,
    CacheMetadata,
} from "./types/flashcard";

// Category Management
const selectedCategory = ref<string | null>(null);
const categories = ref<CategoryStore[]>([]);
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
        count: store.questions.length,
    })),
);

// State
const cards = ref<Flashcard[]>([]);
const currentIndex = ref(0);
const isFlipped = ref(false);
const completedCards = ref(new Set<string>());

// Touch gesture state
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);

// Touch gesture constants
const MIN_SWIPE_DISTANCE = 50;
const MAX_VERTICAL_DISTANCE = 100;

// Computed
const currentCard = computed(() => cards.value[currentIndex.value]);
const totalCards = computed(() => cards.value.length);

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

// Category Selection Methods
const selectCategory = (categoryId: string) => {
    selectedCategory.value = categoryId;
    // Find the selected category store and load its questions
    const selectedStore = categories.value.find(
        (store) => store.id === categoryId,
    );
    if (selectedStore) {
        cards.value = [...selectedStore.questions];
    }
    currentIndex.value = 0;
    isFlipped.value = false;
    completedCards.value.clear();
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

// Ref for flashcard view element
const flashcardViewRef = ref<HTMLElement | null>(null);

// Helper function to add touch event listeners
const addTouchListeners = () => {
    if (flashcardViewRef.value) {
        flashcardViewRef.value.addEventListener('touchstart', handleTouchStart, { passive: true });
        flashcardViewRef.value.addEventListener('touchmove', handleTouchMove, { passive: true });
        flashcardViewRef.value.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
};

// Helper function to remove touch event listeners
const removeTouchListeners = () => {
    if (flashcardViewRef.value) {
        flashcardViewRef.value.removeEventListener('touchstart', handleTouchStart);
        flashcardViewRef.value.removeEventListener('touchmove', handleTouchMove);
        flashcardViewRef.value.removeEventListener('touchend', handleTouchEnd);
    }
};

// Watch for selectedCategory changes to add/remove event listeners
watch(selectedCategory, async (newValue) => {
    if (newValue) {
        // Category selected, wait for DOM update then add listeners
        await nextTick();
        addTouchListeners();
    } else {
        // Category deselected, remove listeners
        removeTouchListeners();
    }
});

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

// Cleanup event listeners on unmount
onUnmounted(() => {
    removeTouchListeners();
});

const backToCategories = () => {
    selectedCategory.value = null;
    cards.value = [];
    currentIndex.value = 0;
    isFlipped.value = false;
    completedCards.value.clear();
};

// Methods
const toggleFlip = () => {
    isFlipped.value = !isFlipped.value;
    if (isFlipped.value) {
        completedCards.value.add(currentCard.value.id);
    }
};

const nextCard = () => {
    if (currentIndex.value < totalCards.value - 1) {
        currentIndex.value++;
        isFlipped.value = false;
    }
};

const previousCard = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        isFlipped.value = false;
    }
};

const shuffleCards = () => {
    const shuffled = [...cards.value];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    cards.value = shuffled;
    currentIndex.value = 0;
    isFlipped.value = false;
};

const resetProgress = () => {
    completedCards.value.clear();
    currentIndex.value = 0;
    isFlipped.value = false;
};

// Touch gesture handlers
const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0].clientX;
    touchStartY.value = e.touches[0].clientY;
};

const handleTouchMove = (e: TouchEvent) => {
    touchEndX.value = e.touches[0].clientX;
    touchEndY.value = e.touches[0].clientY;
};

const handleTouchEnd = () => {
    const deltaX = touchEndX.value - touchStartX.value;
    const deltaY = Math.abs(touchEndY.value - touchStartY.value);

    // Only process swipe if vertical movement is within acceptable range
    if (deltaY <= MAX_VERTICAL_DISTANCE) {
        // Right swipe - back to categories
        if (deltaX > MIN_SWIPE_DISTANCE) {
            backToCategories();
        }
        // Left swipe - next card
        else if (deltaX < -MIN_SWIPE_DISTANCE && currentIndex.value < totalCards.value - 1) {
            nextCard();
        }
    }

    // Reset touch coordinates
    touchStartX.value = 0;
    touchStartY.value = 0;
    touchEndX.value = 0;
    touchEndY.value = 0;
};
</script>

<style scoped>
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
}



.main-content {
    flex: 1;
    padding: 1.5rem 1rem;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}



.flashcard-wrapper {
    width: 100%;
    margin-bottom: 1.5rem;
}



.app-footer {
    background-color: #1f2937;
    color: #9ca3af;
    padding: 1rem;
    text-align: center;
    font-size: 0.875rem;
}

.app-footer p {
    margin: 0;
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

    .flashcard-wrapper {
        width: 100%;
    }
}


</style>
