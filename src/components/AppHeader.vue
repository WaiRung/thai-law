<template>
    <header class="app-header">
        <div class="header-content">
            <button
                v-show="showBackButton"
                @click="handleBack"
                class="back-btn"
                aria-label="Back to categories"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class="back-icon"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>
            <div class="header-text">
                <h1 class="app-title">Thai Law Flashcards</h1>
                <p class="app-subtitle">Thai Law Flashcards</p>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { computed } from "vue";

const router = useRouter();
const route = useRoute();

// Show back button when not on the home route
const showBackButton = computed(() => route.path !== '/');

const handleBack = () => {
    router.back();
};
</script>

<style scoped>
.app-header {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 1.5rem 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto;
    position: relative;
}

.back-btn {
    position: absolute;
    left: 0;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.back-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-2px);
}

.back-btn:active {
    transform: translateX(0);
}

.back-icon {
    width: 1.5rem;
    height: 1.5rem;
}

.header-text {
    text-align: center;
}

.app-title {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 0;
    margin-bottom: 0.5rem;
}

.app-subtitle {
    font-size: 1rem;
    margin: 0;
    opacity: 0.9;
}

@media (max-width: 640px) {
    .app-header {
        padding: 1rem 0.75rem;
    }

    .header-content {
        gap: 0.5rem;
    }

    .back-btn {
        padding: 0.375rem;
    }

    .back-icon {
        width: 1.25rem;
        height: 1.25rem;
    }

    .app-title {
        font-size: 1.5rem;
    }

    .app-subtitle {
        font-size: 0.875rem;
    }
}
</style>
