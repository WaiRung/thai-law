<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังเตรียมคำถาม..." />
        
        <!-- Quiz in Progress -->
        <template v-else-if="!showResult && currentQuestion">
            <!-- Progress Bar -->
            <div class="quiz-progress">
                <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                </div>
                <div class="progress-text">
                    <span>คะแนน: {{ score }}/{{ answeredCount }}</span>
                </div>
            </div>

            <!-- Quiz Question -->
            <QuizQuestion
                :question="currentQuestion"
                :question-number="currentQuestionIndex + 1"
                :total-questions="totalQuestions"
                :selected-answer="selectedAnswer"
                :is-answered="isAnswered"
                :is-correct="isCorrect"
                @select="handleSelectAnswer"
            />

            <!-- Next Button -->
            <div v-if="isAnswered" class="next-button-container">
                <button class="next-button" @click="handleNext">
                    {{ isLastQuestion ? 'ดูผลลัพธ์' : 'ข้อถัดไป' }}
                    <span class="next-arrow">→</span>
                </button>
            </div>
        </template>

        <!-- Quiz Result -->
        <QuizResult
            v-else-if="showResult"
            :result="quizResult"
            @play-again="handlePlayAgain"
            @back="handleBack"
        />
    </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import QuizQuestion from "../components/QuizQuestion.vue";
import QuizResult from "../components/QuizResult.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { categoryStores } from "../data/categoryStores";
import { fetchCategories } from "../services/api";
import { getCategoriesCache, isCacheValid } from "../services/cache";
import { filterQuestions } from "../services/filterService";
import { generateQuizQuestions } from "../services/quizService";
import { useHeader } from "../composables/useHeader";
import type { QuizQuestion as QuizQuestionType, QuizResult as QuizResultType } from "../types/quiz";
import type { CategoryStore } from "../types/flashcard";

const router = useRouter();
const route = useRoute();
const { setHeader, resetHeader } = useHeader();

// Constants
const QUIZ_QUESTION_COUNT = 10;

// Get categoryId from route params
const categoryId = computed(() => route.params.categoryId as string);

// State
const isLoading = ref(true);
const questions = ref<QuizQuestionType[]>([]);
const currentQuestionIndex = ref(0);
const score = ref(0);
const selectedAnswer = ref<string | null>(null);
const isAnswered = ref(false);
const isCorrect = ref<boolean | null>(null);
const showResult = ref(false);
const categories = ref<CategoryStore[]>([]);

// Computed
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const totalQuestions = computed(() => questions.value.length);
const isLastQuestion = computed(() => currentQuestionIndex.value >= totalQuestions.value - 1);
const answeredCount = computed(() => currentQuestionIndex.value + (isAnswered.value ? 1 : 0));
const progressPercentage = computed(() => (answeredCount.value / totalQuestions.value) * 100);

const quizResult = computed<QuizResultType>(() => ({
    totalQuestions: totalQuestions.value,
    correctAnswers: score.value,
    score: score.value,
    percentage: Math.round((score.value / totalQuestions.value) * 100),
}));

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

// Initialize quiz
const initializeQuiz = async () => {
    isLoading.value = true;
    
    await loadCategories();
    
    const selectedStore = categories.value.find(
        (store) => store.id === categoryId.value,
    );
    
    if (!selectedStore) {
        // Invalid category ID, redirect to home
        console.warn(`Category not found: ${categoryId.value}`);
        router.replace('/');
        return;
    }

    // Set header title and subtitle
    setHeader(selectedStore.nameTh, selectedStore.nameEn);

    // Apply question filtering
    const filteredQuestions = await filterQuestions(
        categoryId.value,
        selectedStore.questions
    );

    // Generate quiz questions
    questions.value = generateQuizQuestions(filteredQuestions, QUIZ_QUESTION_COUNT);
    
    // Reset state
    currentQuestionIndex.value = 0;
    score.value = 0;
    selectedAnswer.value = null;
    isAnswered.value = false;
    isCorrect.value = null;
    showResult.value = false;
    
    isLoading.value = false;
};

// Handle answer selection
const handleSelectAnswer = (answer: string) => {
    if (isAnswered.value) return;
    
    selectedAnswer.value = answer;
    isAnswered.value = true;
    isCorrect.value = answer === currentQuestion.value.correctAnswer;
    
    if (isCorrect.value) {
        score.value++;
    }
};

// Handle next question
const handleNext = () => {
    if (isLastQuestion.value) {
        showResult.value = true;
    } else {
        currentQuestionIndex.value++;
        selectedAnswer.value = null;
        isAnswered.value = false;
        isCorrect.value = null;
    }
};

// Handle play again
const handlePlayAgain = () => {
    initializeQuiz();
};

// Handle back to categories
const handleBack = () => {
    router.push({ name: "quizlaw-categories" });
};

// Initialize on mount
onMounted(() => {
    initializeQuiz();
});

// Cleanup on unmount
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
    gap: 1.5rem;
}

.quiz-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.progress-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    display: flex;
    justify-content: flex-end;
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.next-button-container {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.next-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.next-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.next-arrow {
    font-size: 1.25rem;
    transition: transform 0.2s;
}

.next-button:hover .next-arrow {
    transform: translateX(4px);
}

@media (max-width: 640px) {
    .main-content {
        padding: 1rem 0.75rem;
        gap: 1rem;
    }

    .next-button {
        padding: 0.875rem 1.5rem;
        width: 100%;
        justify-content: center;
    }
}
</style>
