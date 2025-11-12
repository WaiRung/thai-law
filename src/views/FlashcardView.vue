<template>
    <main class="main-content" ref="flashcardViewRef" v-if="currentCard">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import FlashCard from "../components/FlashCard.vue";
import ProgressBar from "../components/ProgressBar.vue";
import FlashcardControls from "../components/FlashcardControls.vue";
import { categoryStores } from "../data/categoryStores";
import { fetchCategories } from "../services/api";
import {
    getCategoriesCache,
    isCacheValid,
} from "../services/cache";
import { filterQuestions } from "../services/filterService";
import type {
    Flashcard,
    CategoryStore,
} from "../types/flashcard";
import { useHeader } from "../composables/useHeader";

const router = useRouter();
const route = useRoute();
const { setHeader, resetHeader } = useHeader();

// Get categoryId from route params
const categoryId = computed(() => route.params.categoryId as string);

// State
const cards = ref<Flashcard[]>([]);
const currentIndex = ref(0);
const isFlipped = ref(false);
const completedCards = ref(new Set<string>());
const categories = ref<CategoryStore[]>([]);

// Touch gesture state
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);

// Touch gesture constants
const MIN_SWIPE_DISTANCE = 50;
const MAX_VERTICAL_DISTANCE = 100;

// Ref for flashcard view element
const flashcardViewRef = ref<HTMLElement | null>(null);

// Computed
const currentCard = computed(() => cards.value[currentIndex.value]);
const totalCards = computed(() => cards.value.length);

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

// Load flashcards for the selected category
const loadFlashcards = async () => {
    const selectedStore = categories.value.find(
        (store) => store.id === categoryId.value,
    );
    
    if (!selectedStore) {
        // Invalid category ID, redirect to home using replace to avoid adding to history
        console.warn(`Category not found: ${categoryId.value}`);
        router.replace('/');
        return;
    }

    // Set header title and subtitle based on the selected category
    setHeader(selectedStore.nameTh, selectedStore.nameEn);

    // Apply question filtering based on allowed IDs
    const filteredQuestions = await filterQuestions(
        categoryId.value,
        selectedStore.questions
    );

    cards.value = [...filteredQuestions];
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
        // Right swipe - back to categories (use back to preserve history)
        if (deltaX > MIN_SWIPE_DISTANCE) {
            router.back();
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

// Watch for category changes in route params
watch(() => route.params.categoryId, async (newCategoryId) => {
    if (newCategoryId && categories.value.length > 0) {
        loadFlashcards();
    }
});

// Watch for categories to be loaded and then load flashcards
watch(() => categories.value.length, (newLength) => {
    if (newLength > 0 && categoryId.value) {
        loadFlashcards();
    }
});

// Initialize on mount
onMounted(async () => {
    await loadCategories();
    // loadFlashcards will be called by the watch above when categories are loaded
    
    // Add touch listeners after DOM update
    await nextTick();
    addTouchListeners();
});

// Cleanup event listeners on unmount
onUnmounted(() => {
    removeTouchListeners();
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

.flashcard-wrapper {
    width: 100%;
    margin-bottom: 1.5rem;
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
