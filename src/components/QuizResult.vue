<template>
    <div class="quiz-result-container">
        <div class="result-card">
            <div class="result-icon">{{ resultEmoji }}</div>
            <h2 class="result-title">{{ resultTitle }}</h2>
            <p class="result-subtitle">Quiz Completed!</p>
            
            <div class="score-display">
                <div class="score-circle" :class="scoreClass">
                    <span class="score-percentage">{{ result.percentage }}%</span>
                </div>
            </div>

            <!-- Total Score -->
            <div class="total-score-container">
                <div class="total-score-value">{{ result.correctAnswers }} / {{ result.totalQuestions }}</div>
                <div class="total-score-label">คะแนนรวม</div>
            </div>
            
            <div class="stats-container">
                <div class="stat-item">
                    <span class="stat-value correct">{{ result.correctAnswers }}</span>
                    <span class="stat-label">ถูกต้อง</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-value incorrect">{{ result.totalQuestions - result.correctAnswers }}</span>
                    <span class="stat-label">ไม่ถูกต้อง</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-value total">{{ result.totalQuestions }}</span>
                    <span class="stat-label">ทั้งหมด</span>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="action-button primary" @click="handlePlayAgain">
                    <span class="button-icon">🔄</span>
                    เล่นอีกครั้ง
                </button>
                <button class="action-button secondary" @click="handleBack">
                    <span class="button-icon">←</span>
                    เลือกหมวดหมู่
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { QuizResult } from "../types/quiz";

interface Props {
    result: QuizResult;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    playAgain: [];
    back: [];
}>();

const resultEmoji = computed(() => {
    if (props.result.percentage >= 80) return "🏆";
    if (props.result.percentage >= 60) return "🎉";
    if (props.result.percentage >= 40) return "👍";
    return "💪";
});

const resultTitle = computed(() => {
    if (props.result.percentage >= 80) return "ยอดเยี่ยม!";
    if (props.result.percentage >= 60) return "ดีมาก!";
    if (props.result.percentage >= 40) return "พอใช้";
    return "ลองอีกครั้ง!";
});

const scoreClass = computed(() => {
    if (props.result.percentage >= 80) return "excellent";
    if (props.result.percentage >= 60) return "good";
    if (props.result.percentage >= 40) return "fair";
    return "needs-improvement";
});

const handlePlayAgain = () => {
    emit("playAgain");
};

const handleBack = () => {
    emit("back");
};
</script>

<style scoped>
.quiz-result-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 1rem;
}

.result-card {
    background: white;
    border-radius: 1.5rem;
    padding: 2rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 400px;
    width: 100%;
}

.result-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.result-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
}

.result-subtitle {
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
}

.score-display {
    margin-bottom: 1.5rem;
}

.score-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 6px solid;
}

.score-circle.excellent {
    border-color: #10b981;
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.score-circle.good {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.score-circle.fair {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.score-circle.needs-improvement {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.score-percentage {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
}

.total-score-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 1rem;
    border: 2px solid #f59e0b;
}

.total-score-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: #b45309;
}

.total-score-label {
    font-size: 0.875rem;
    color: #92400e;
    font-weight: 600;
}

.stats-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 1rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
}

.stat-value.correct {
    color: #10b981;
}

.stat-value.incorrect {
    color: #ef4444;
}

.stat-value.total {
    color: #6b7280;
}

.stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
}

.stat-divider {
    width: 1px;
    height: 40px;
    background: #e5e7eb;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.action-button.primary {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
}

.action-button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.action-button.secondary {
    background: #f3f4f6;
    color: #4b5563;
    border: 2px solid #e5e7eb;
}

.action-button.secondary:hover {
    background: #e5e7eb;
}

.button-icon {
    font-size: 1.25rem;
}

@media (max-width: 640px) {
    .result-card {
        padding: 1.5rem;
    }

    .result-icon {
        font-size: 3rem;
    }

    .result-title {
        font-size: 1.5rem;
    }

    .score-circle {
        width: 100px;
        height: 100px;
    }

    .score-percentage {
        font-size: 1.75rem;
    }

    .stats-container {
        gap: 1rem;
    }

    .stat-value {
        font-size: 1.25rem;
    }
}
</style>
