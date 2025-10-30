<template>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">เกิดข้อผิดพลาด</h3>
        <p class="error-message">{{ message }}</p>
        <button v-if="showRetry" @click="retry" class="retry-btn">
            ลองอีกครั้ง
        </button>
    </div>
</template>

<script setup lang="ts">
interface Props {
    message: string;
    showRetry?: boolean;
}

withDefaults(defineProps<Props>(), {
    showRetry: true,
});

const emit = defineEmits<{
    retry: [];
}>();

const retry = () => {
    emit('retry');
};
</script>

<style scoped>
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    min-height: 300px;
    text-align: center;
}

.error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.error-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ef4444;
    margin: 0;
    margin-bottom: 0.5rem;
}

.error-message {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
    margin-bottom: 1.5rem;
    max-width: 400px;
}

.retry-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.retry-btn:active {
    transform: translateY(0);
}
</style>
