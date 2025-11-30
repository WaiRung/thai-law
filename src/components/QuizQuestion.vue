<template>
    <div class="quiz-question-container">
        <!-- Question Card -->
        <div class="question-card">
            <div class="question-header">
                <span class="question-number">ข้อ {{ questionNumber }} / {{ totalQuestions }}</span>
                <span class="question-type">{{ typeLabel }}</span>
            </div>
            <div class="question-content">{{ question.question }}</div>
        </div>

        <!-- Answer Choices -->
        <div class="choices-container">
            <button
                v-for="(choice, index) in question.choices"
                :key="index"
                class="choice-button"
                :class="{
                    'selected': selectedAnswer === choice,
                    'correct': isAnswered && choice === question.correctAnswer,
                    'incorrect': isAnswered && selectedAnswer === choice && choice !== question.correctAnswer,
                    'disabled': isAnswered,
                }"
                @click="selectChoice(choice)"
                :disabled="isAnswered"
            >
                <span class="choice-letter">{{ choiceLetters[index] }}</span>
                <span class="choice-text">{{ choice }}</span>
                <span v-if="isAnswered && choice === question.correctAnswer" class="choice-icon correct-icon">✓</span>
                <span v-if="isAnswered && selectedAnswer === choice && choice !== question.correctAnswer" class="choice-icon incorrect-icon">✗</span>
            </button>
        </div>

        <!-- Result Feedback -->
        <div v-if="isAnswered" class="result-feedback" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
            <div class="result-icon">{{ isCorrect ? '🎉' : '😅' }}</div>
            <div class="result-text">{{ isCorrect ? 'ถูกต้อง!' : 'ไม่ถูกต้อง' }}</div>
            <div v-if="!isCorrect" class="correct-answer">
                คำตอบที่ถูกต้อง: {{ question.correctAnswer }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { QuizQuestion } from "../types/quiz";

interface Props {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
    selectedAnswer: string | null;
    isAnswered: boolean;
    isCorrect: boolean | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    select: [answer: string];
}>();

const choiceLetters = ["ก", "ข", "ค", "ง"];

const typeLabel = computed(() => {
    switch (props.question.type) {
        case "section":
            return "มาตรา";
        case "paragraph":
            return "วรรค";
        case "subsection":
            return "อนุ";
        default:
            return "";
    }
});

const selectChoice = (choice: string) => {
    if (!props.isAnswered) {
        emit("select", choice);
    }
};
</script>

<style scoped>
.quiz-question-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
}

.question-card {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    color: white;
    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

.question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.question-number {
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
}

.question-type {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    font-weight: 500;
}

.question-content {
    font-size: 1.125rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.choices-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.choice-button {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
}

.choice-button:hover:not(.disabled) {
    border-color: #6366f1;
    background: #f5f3ff;
}

.choice-button.selected:not(.correct):not(.incorrect) {
    border-color: #6366f1;
    background: #ede9fe;
}

.choice-button.correct {
    border-color: #10b981;
    background: #d1fae5;
}

.choice-button.incorrect {
    border-color: #ef4444;
    background: #fee2e2;
}

.choice-button.disabled {
    cursor: default;
}

.choice-letter {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: #f3f4f6;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.875rem;
    color: #4b5563;
    flex-shrink: 0;
}

.choice-button.correct .choice-letter {
    background: #10b981;
    color: white;
}

.choice-button.incorrect .choice-letter {
    background: #ef4444;
    color: white;
}

.choice-text {
    flex: 1;
    font-size: 1rem;
    color: #1f2937;
    font-weight: 500;
}

.choice-icon {
    font-size: 1.25rem;
    font-weight: bold;
}

.correct-icon {
    color: #10b981;
}

.incorrect-icon {
    color: #ef4444;
}

.result-feedback {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    border-radius: 1rem;
    text-align: center;
}

.result-feedback.correct {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.result-feedback.incorrect {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.result-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.result-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
}

.result-feedback.correct .result-text {
    color: #065f46;
}

.result-feedback.incorrect .result-text {
    color: #991b1b;
}

.correct-answer {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
}

@media (max-width: 640px) {
    .question-card {
        padding: 1.25rem;
    }

    .question-content {
        font-size: 1rem;
    }

    .choice-button {
        padding: 0.875rem 1rem;
    }

    .choice-letter {
        width: 1.75rem;
        height: 1.75rem;
        font-size: 0.75rem;
    }

    .choice-text {
        font-size: 0.875rem;
    }
}
</style>
