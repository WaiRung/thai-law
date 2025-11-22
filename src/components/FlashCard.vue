<template>
    <div class="flashcard-container" @click="handleFlip">
        <div class="flashcard" :class="{ 'is-flipped': isFlipped }">
            <div class="flashcard-face flashcard-front">
                <div class="card-content">
                    <div class="card-label">คำใบ้</div>
                    <div class="card-text">{{ card.question }}</div>
                </div>
                <div class="tap-hint">แตะเพื่อดูคำตอบ</div>
            </div>
            <div class="flashcard-face flashcard-back">
                <button
                    v-if="hasDescription"
                    class="info-button"
                    @click.stop="handleShowDescription"
                    aria-label="ดูคำอธิบายเพิ่มเติม"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="info-icon"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
                <div class="card-content">
                    <div class="card-label">คำตอบ</div>
                    <div class="card-answer">{{ card.answer }}</div>
                </div>
                <div class="tap-hint">แตะเพื่อดูคำใบ้</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Flashcard } from "../types/flashcard";

interface Props {
    card: Flashcard;
    isFlipped: boolean;
    hasDescription: boolean;
    sectionId: string;
}

defineProps<Props>();

const emit = defineEmits<{
    flip: [];
    showDescription: [];
}>();

const handleFlip = () => {
    emit("flip");
};

const handleShowDescription = () => {
    emit("showDescription");
};
</script>

<style scoped>
.flashcard-container {
    perspective: 1000px;
    width: 100%;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    z-index: 10;
}

.flashcard {
    position: relative;
    width: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
}

.flashcard.is-flipped {
    transform: rotateY(180deg);
}

.flashcard-face {
    width: 100%;
    min-height: 400px;
    backface-visibility: hidden;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
}

.flashcard-front {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.flashcard-back {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    transform: rotateY(180deg);
    position: absolute;
    top: 0;
    left: 0;
}

.info-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 20;
    padding: 0;
}

.info-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.7);
    transform: scale(1.05);
}

.info-button:active {
    transform: scale(0.95);
}

.info-icon {
    width: 20px;
    height: 20px;
    color: white;
}

.card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.card-label {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.card-text {
    font-size: 1.5rem;
    line-height: 1.6;
    text-align: center;
    font-weight: 500;
    word-wrap: break-word;
    max-width: 100%;
    white-space: pre-wrap;
}

.card-answer {
    font-size: 1.5rem;
    line-height: 1.6;
    text-align: left;
    font-weight: 500;
    word-wrap: break-word;
    max-width: 100%;
    white-space: pre-wrap;
}

.card-category {
    margin-top: 1.5rem;
    padding: 0.5rem 1rem;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.tap-hint {
    margin-top: 1.5rem;
    font-size: 0.875rem;
    opacity: 0.7;
    font-style: italic;
}

@media (max-width: 640px) {
    .flashcard-face {
        padding: 1.5rem;
        min-height: 350px;
    }

    .card-label {
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    .card-text {
        font-size: 1.125rem;
    }

    .card-category {
        font-size: 0.75rem;
        margin-top: 1rem;
    }

    .tap-hint {
        font-size: 0.75rem;
        margin-top: 1rem;
    }
}
</style>
