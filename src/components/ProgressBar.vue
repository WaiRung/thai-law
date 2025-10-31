<template>
    <div class="progress-section">
        <div class="progress-text">
            <span class="progress-label">ความคืบหน้า</span>
            <span class="progress-count"
                >{{ currentIndex + 1 }} / {{ totalCards }}</span
            >
        </div>
        <div class="progress-bar">
            <div
                class="progress-fill"
                :style="{ width: `${progressPercentage}%` }"
            ></div>
        </div>
        <div class="completed-text">
            ทำไปแล้ว {{ completedCount }} จากทั้งหมด {{ totalCards }} ใบ
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
    currentIndex: number;
    totalCards: number;
    completedCount: number;
}

const props = defineProps<Props>();

const progressPercentage = computed(
    () => ((props.currentIndex + 1) / props.totalCards) * 100,
);
</script>

<style scoped>
.progress-section {
    margin-bottom: 1.5rem;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: #4b5563;
}

.progress-label {
    font-weight: 600;
}

.progress-count {
    font-weight: 700;
    color: #3b82f6;
}

.progress-bar {
    width: 100%;
    height: 0.75rem;
    background-color: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    transition: width 0.3s ease;
}

.completed-text {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: center;
}
</style>
