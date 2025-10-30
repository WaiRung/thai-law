<template>
    <div class="flashcard-container" @click="handleFlip">
        <div class="flashcard" :class="{ 'is-flipped': isFlipped }">
            <div class="flashcard-face flashcard-front">
                <div class="card-content">
                    <div class="card-label">คำถาม</div>
                    <div class="card-text">{{ card.question }}</div>
                    <div v-if="card.category" class="card-category">
                        {{ card.category }}
                    </div>
                </div>
                <div class="tap-hint">แตะเพื่อดูคำตอบ</div>
            </div>
            <div class="flashcard-face flashcard-back">
                <div class="card-content">
                    <div class="card-label">คำตอบ</div>
                    <div class="card-text">{{ card.answer }}</div>
                    <div v-if="card.category" class="card-category">
                        {{ card.category }}
                    </div>
                </div>
                <div class="tap-hint">แตะเพื่อดูคำถาม</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Flashcard } from "../types/flashcard";

interface Props {
    card: Flashcard;
    isFlipped: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
    flip: [];
}>();

const handleFlip = () => {
    emit("flip");
};
</script>

<style scoped>
.flashcard-container {
    perspective: 1000px;
    width: 100%;
    height: 100%;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.flashcard {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
}

.flashcard.is-flipped {
    transform: rotateY(180deg);
}

.flashcard-face {
    position: absolute;
    width: 100%;
    height: 100%;
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
