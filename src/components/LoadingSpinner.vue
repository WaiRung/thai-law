<template>
    <div class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    message?: string;
}

withDefaults(defineProps<Props>(), {
    message: 'กำลังโหลด...',
});
</script>

<style scoped>
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    min-height: 300px;
}

.spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
}
</style>
