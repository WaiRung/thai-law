<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังเตรียมคำถาม..." />
        
        <!-- Quiz in Progress -->
        <template v-else-if="!showResult && currentQuestion">
            <!-- Progress Bar with Timer -->
            <div class="quiz-progress">
                <div class="progress-header">
                    <div class="timer-display" :class="{ 'timer-warning': remainingTime <= 5, 'timer-danger': remainingTime <= 3 }">
                        <span class="timer-icon">⏱️</span>
                        <span class="timer-value">{{ formattedTime }}</span>
                    </div>
                    <div class="score-display">
                        <span class="score-label">คะแนน:</span>
                        <span class="score-value">{{ totalScore.toFixed(1) }}</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                </div>
                <div class="timer-bar">
                    <div 
                        class="timer-fill" 
                        :class="{ 'timer-warning': remainingTime <= 5, 'timer-danger': remainingTime <= 3 }"
                        :style="{ width: timerPercentage + '%' }"
                    ></div>
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
                :last-answer-score="lastAnswerScore"
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
import { calculateCountdownTime, calculateAnswerScore, formatTime } from "../services/scoreService";
import { useHeader } from "../composables/useHeader";
import type { QuizQuestion as QuizQuestionType, QuizResult as QuizResultType, QuizAnswerScore } from "../types/quiz";
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

// Timer state
const remainingTime = ref(0);
const totalTimeForQuestion = ref(0);
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null);
const totalScore = ref(0);
const totalTimeBonus = ref(0);
const lastAnswerScore = ref<QuizAnswerScore | null>(null);

// Computed
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const totalQuestions = computed(() => questions.value.length);
const isLastQuestion = computed(() => currentQuestionIndex.value >= totalQuestions.value - 1);
const answeredCount = computed(() => currentQuestionIndex.value + (isAnswered.value ? 1 : 0));
const progressPercentage = computed(() => (answeredCount.value / totalQuestions.value) * 100);
const timerPercentage = computed(() => {
    if (totalTimeForQuestion.value === 0) return 0;
    return (remainingTime.value / totalTimeForQuestion.value) * 100;
});
const formattedTime = computed(() => formatTime(remainingTime.value));

const quizResult = computed<QuizResultType>(() => ({
    totalQuestions: totalQuestions.value,
    correctAnswers: score.value,
    score: score.value,
    percentage: Math.round((score.value / totalQuestions.value) * 100),
    timeBonus: Math.round(totalTimeBonus.value * 100) / 100,
    totalScore: Math.round(totalScore.value * 100) / 100,
}));

// Timer functions
const startTimer = () => {
    stopTimer();
    if (!currentQuestion.value) return;
    
    // Calculate countdown time based on question length
    const questionTime = calculateCountdownTime(currentQuestion.value.question);
    totalTimeForQuestion.value = questionTime;
    remainingTime.value = questionTime;
    
    timerInterval.value = setInterval(() => {
        if (remainingTime.value > 0 && !isAnswered.value) {
            remainingTime.value = Math.max(0, remainingTime.value - 0.1);
        } else if (remainingTime.value <= 0 && !isAnswered.value) {
            // Time's up - auto-fail the question
            handleTimeUp();
        }
    }, 100);
};

const stopTimer = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
};

const handleTimeUp = () => {
    if (isAnswered.value) return;
    
    selectedAnswer.value = null;
    isAnswered.value = true;
    isCorrect.value = false;
    lastAnswerScore.value = {
        baseScore: 0,
        timeBonus: 0,
        totalPoints: 0,
    };
    stopTimer();
};

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
    stopTimer();
    
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
    totalScore.value = 0;
    totalTimeBonus.value = 0;
    selectedAnswer.value = null;
    isAnswered.value = false;
    isCorrect.value = null;
    showResult.value = false;
    lastAnswerScore.value = null;
    
    isLoading.value = false;
    
    // Start timer for first question
    startTimer();
};

// Handle answer selection
const handleSelectAnswer = (answer: string) => {
    if (isAnswered.value) return;
    
    stopTimer();
    
    selectedAnswer.value = answer;
    isAnswered.value = true;
    isCorrect.value = answer === currentQuestion.value.correctAnswer;
    
    // Calculate score with time bonus
    const answerScore = calculateAnswerScore(
        isCorrect.value,
        remainingTime.value,
        totalTimeForQuestion.value
    );
    
    lastAnswerScore.value = answerScore;
    
    if (isCorrect.value) {
        score.value++;
    }
    
    totalScore.value += answerScore.totalPoints;
    totalTimeBonus.value += answerScore.timeBonus;
};

// Handle next question
const handleNext = () => {
    if (isLastQuestion.value) {
        stopTimer();
        showResult.value = true;
    } else {
        currentQuestionIndex.value++;
        selectedAnswer.value = null;
        isAnswered.value = false;
        isCorrect.value = null;
        lastAnswerScore.value = null;
        startTimer();
    }
};

// Handle play again
const handlePlayAgain = () => {
    initializeQuiz();
};

// Handle back to categories
const handleBack = () => {
    stopTimer();
    router.push({ name: "quizlaw-categories" });
};

// Initialize on mount
onMounted(() => {
    initializeQuiz();
});

// Cleanup on unmount
onUnmounted(() => {
    stopTimer();
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

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.timer-display {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: #f3f4f6;
    border-radius: 1rem;
    font-weight: 600;
    font-size: 1rem;
    color: #374151;
    transition: all 0.3s ease;
}

.timer-display.timer-warning {
    background: #fef3c7;
    color: #b45309;
}

.timer-display.timer-danger {
    background: #fee2e2;
    color: #dc2626;
    animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.timer-icon {
    font-size: 1rem;
}

.timer-value {
    min-width: 2rem;
    text-align: center;
}

.score-display {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.score-value {
    color: #6366f1;
    font-weight: 700;
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

.timer-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
}

.timer-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    border-radius: 2px;
    transition: width 0.1s linear;
}

.timer-fill.timer-warning {
    background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.timer-fill.timer-danger {
    background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
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
