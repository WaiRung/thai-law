<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังเตรียมคำถาม..." />
        
        <!-- Quiz in Progress -->
        <template v-else-if="!showResult && currentQuestion">
            <!-- Progress Bar with Timer -->
            <div class="quiz-progress">
                <div class="progress-header">
                    <div class="timer-display" :class="{ 'timer-warning': remainingTime <= 5, 'timer-danger': remainingTime <= 3, 'timer-paused': isPaused }">
                        <span class="timer-icon">{{ isPaused ? '⏸️' : '⏱️' }}</span>
                        <span class="timer-value">{{ formattedTime }}</span>
                    </div>
                    <button 
                        v-if="!isAnswered" 
                        class="pause-button" 
                        :class="{ 'paused': isPaused }"
                        @click="togglePause"
                        :aria-label="isPaused ? 'ดำเนินการต่อ' : 'หยุดชั่วคราว'"
                    >
                        <span class="pause-icon">{{ isPaused ? '▶️' : '⏸️' }}</span>
                        <span class="pause-text">{{ isPaused ? 'ต่อ' : 'พัก' }}</span>
                    </button>
                    <div class="score-display">
                        <span class="score-label">คะแนน:</span>
                        <span class="score-value">{{ score }}/{{ totalQuestions }}</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                </div>
                <div class="timer-bar">
                    <div 
                        class="timer-fill" 
                        :class="{ 'timer-warning': remainingTime <= 5, 'timer-danger': remainingTime <= 3, 'timer-paused': isPaused }"
                        :style="{ width: timerPercentage + '%' }"
                    ></div>
                </div>
            </div>

            <!-- Pause Overlay -->
            <div v-if="isPaused" class="pause-overlay">
                <div class="pause-modal">
                    <div class="pause-icon-large">⏸️</div>
                    <h2 class="pause-title">หยุดพักชั่วคราว</h2>
                    <p class="pause-subtitle">คลิกปุ่มด้านล่างเพื่อเล่นต่อ</p>
                    <button class="resume-button" @click="togglePause">
                        <span class="resume-icon">▶️</span>
                        เล่นต่อ
                    </button>
                </div>
            </div>

            <!-- Quiz Question (hidden when paused) -->
            <template v-if="!isPaused">
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
        </template>

        <!-- Quiz Result -->
        <QuizResult
            v-else-if="showResult"
            :result="quizResult"
            :category-id="categoryId"
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
import { filterQuestionsByDataSource } from "../services/filterService";
import { generateQuizQuestions } from "../services/quizService";
import { calculateCountdownTime, calculateAnswerScore, formatTime } from "../services/scoreService";
import { useHeader } from "../composables/useHeader";
import type { QuizQuestion as QuizQuestionType, QuizResult as QuizResultType, QuizAnswerScore } from "../types/quiz";
import type { CategoryStore } from "../types/flashcard";

const router = useRouter();
const route = useRoute();
const { setHeader, resetHeader } = useHeader();

// Constants
const QUIZ_QUESTION_COUNT = 20;

// Get categoryId and dataSourceIndex from route params
const categoryId = computed(() => route.params.categoryId as string);
const dataSourceIndex = computed(() => {
    const index = route.params.dataSourceIndex;
    return index !== undefined ? parseInt(index as string, 10) : undefined;
});

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
const timerStartTime = ref(0);
const totalScore = ref(0);
const totalTimeBonus = ref(0);
const lastAnswerScore = ref<QuizAnswerScore | null>(null);

// Pause state
const isPaused = ref(false);
const pauseStartTimestamp = ref(0);

// Helper function for rounding to two decimal places
const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

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
    timeBonus: roundToTwo(totalTimeBonus.value),
    totalScore: roundToTwo(totalScore.value),
    maxScore: totalQuestions.value * 2, // 1 base point + 1 time bonus point per question
}));

// Timer functions
const startTimer = () => {
    stopTimer();
    if (!currentQuestion.value) return;
    
    // Calculate countdown time based on question length
    const questionTime = calculateCountdownTime(currentQuestion.value.question);
    totalTimeForQuestion.value = questionTime;
    remainingTime.value = questionTime;
    timerStartTime.value = Date.now();
    
    timerInterval.value = setInterval(() => {
        if (!isAnswered.value && !isPaused.value) {
            // Use actual elapsed time for accuracy
            const elapsed = (Date.now() - timerStartTime.value) / 1000;
            const remaining = totalTimeForQuestion.value - elapsed;
            remainingTime.value = Math.max(0, remaining);
            
            if (remainingTime.value <= 0) {
                // Time's up - auto-fail the question
                handleTimeUp();
            }
        }
    }, 100);
};

const stopTimer = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
};

// Pause/Resume functions
const togglePause = () => {
    if (isAnswered.value) return;
    
    if (isPaused.value) {
        // Resume: adjust timerStartTime to account for pause duration
        const pauseDuration = (Date.now() - pauseStartTimestamp.value) / 1000;
        timerStartTime.value = timerStartTime.value + (pauseDuration * 1000);
        isPaused.value = false;
    } else {
        // Pause: save timestamp when pause started
        pauseStartTimestamp.value = Date.now();
        isPaused.value = true;
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

    // Set header title and subtitle based on the selected category or data source
    if (dataSourceIndex.value !== undefined && selectedStore.dataSources) {
        const dataSource = selectedStore.dataSources[dataSourceIndex.value];
        if (dataSource) {
            const title = dataSource.nameTh || selectedStore.nameTh;
            const subtitle = dataSource.nameEn || selectedStore.nameEn;
            setHeader(title, subtitle);
        } else {
            setHeader(selectedStore.nameTh, selectedStore.nameEn);
        }
    } else {
        setHeader(selectedStore.nameTh, selectedStore.nameEn);
    }

    // Apply question filtering based on data source
    const filteredQuestions = await filterQuestionsByDataSource(
        categoryId.value,
        selectedStore.questions,
        dataSourceIndex.value
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
    isPaused.value = false;
    
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

.timer-display.timer-paused {
    background: #e0e7ff;
    color: #4338ca;
}

.timer-fill.timer-paused {
    background: linear-gradient(90deg, #818cf8 0%, #6366f1 100%);
}

.pause-button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pause-button:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
}

.pause-button.paused {
    background: #dcfce7;
    border-color: #86efac;
    color: #166534;
}

.pause-button.paused:hover {
    background: #bbf7d0;
}

.pause-icon {
    font-size: 0.875rem;
}

.pause-text {
    font-size: 0.75rem;
}

.pause-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
}

.pause-modal {
    background: white;
    border-radius: 1.5rem;
    padding: 2rem;
    text-align: center;
    max-width: 320px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.pause-icon-large {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.pause-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
}

.pause-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
}

.resume-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.resume-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.resume-icon {
    font-size: 1.25rem;
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

    .pause-button {
        padding: 0.25rem 0.5rem;
    }

    .pause-text {
        display: none;
    }

    .pause-modal {
        padding: 1.5rem;
    }

    .pause-icon-large {
        font-size: 3rem;
    }

    .pause-title {
        font-size: 1.25rem;
    }
}
</style>
