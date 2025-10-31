<template>
    <div class="app-container">
        <!-- Header -->
        <AppHeader />

        <!-- Router View -->
        <router-view />

        <!-- Footer -->
        <footer class="app-footer">
            <p>สำนักกฎหมายธนธรรม ทนายธาตรี ธนธรรมสุนทร เฟซจริง</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
</script>

<style scoped>
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
}

.app-footer {
    background-color: #1f2937;
    color: #9ca3af;
    padding: 1rem;
    text-align: center;
    font-size: 0.875rem;
}

.app-footer p {
    margin: 0;
}
</style>
