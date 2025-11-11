<template>
    <div>
        <!-- Controls -->
        <div class="controls">
            <button
                @click="handlePrevious"
                :disabled="currentIndex === 0"
                class="control-btn control-prev"
                aria-label="Previous card"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class="btn-icon"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
                <span class="btn-text">ก่อนหน้า</span>
            </button>

            <button
                @click="handleShuffle"
                class="control-btn control-shuffle"
                aria-label="Shuffle cards"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class="btn-icon"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
                <span class="btn-text">สุ่ม</span>
            </button>

            <button
                @click="handleNext"
                :disabled="currentIndex === totalCards - 1"
                class="control-btn control-next"
                aria-label="Next card"
            >
                <span class="btn-text">ถัดไป</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class="btn-icon"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>
        </div>

        <!-- Reset Button -->
        <div class="reset-section">
            <button @click="handleReset" class="reset-btn">
                รีเซ็ตความคืบหน้า
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    currentIndex: number;
    totalCards: number;
}

defineProps<Props>();

const emit = defineEmits<{
    previous: [];
    next: [];
    shuffle: [];
    reset: [];
}>();

const handlePrevious = () => {
    emit("previous");
};

const handleNext = () => {
    emit("next");
};

const handleShuffle = () => {
    emit("shuffle");
};

const handleReset = () => {
    emit("reset");
};
</script>

<style scoped>
.controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;
    position: relative;
    z-index: 1;
}

.control-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    color: white;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.control-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.control-btn:active:not(:disabled) {
    transform: translateY(0);
}

.control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.control-shuffle {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.control-shuffle:hover {
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-icon {
    width: 1.25rem;
    height: 1.25rem;
}

.btn-text {
    font-size: 0.875rem;
}

.reset-section {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.reset-btn {
    padding: 0.625rem 1.25rem;
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.reset-btn:hover {
    background-color: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.reset-btn:active {
    transform: translateY(0);
}

@media (max-width: 640px) {
    .controls {
        gap: 0.5rem;
    }

    .control-btn {
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
    }

    .btn-text {
        display: none;
    }

    .btn-icon {
        width: 1.5rem;
        height: 1.5rem;
    }

    .control-shuffle .btn-icon {
        width: 1.25rem;
        height: 1.25rem;
    }
}

@media (min-width: 641px) {
    .control-prev .btn-icon,
    .control-next .btn-icon {
        width: 1.5rem;
        height: 1.5rem;
    }
}
</style>
