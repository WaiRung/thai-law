<template>
    <div class="app-container">
        <!-- Header -->
        <AppHeader />

        <!-- Router View -->
        <router-view />
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
</style>
