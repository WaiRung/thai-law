<template>
    <main class="main-content">
        <div class="menu-container">
            <div class="welcome-section">
                <h2 class="welcome-title">ยินดีต้อนรับ</h2>
                <p class="welcome-subtitle">Welcome to Thai Law</p>
            </div>

            <!-- Cache Status Section - Main functionality -->
            <CacheStatus
                :is-cache-available="isCacheAvailable"
                :cache-metadata="cacheMetadata"
                :is-downloading="isDownloading"
                :download-success="downloadSuccess"
                @reload="handleDownloadData"
            />

            <div class="menu-items">
                <button @click="navigateToFlashcards" class="menu-item">
                    <div class="menu-item-icon">🎴</div>
                    <div class="menu-item-content">
                        <h3 class="menu-item-title">Flashcards</h3>
                        <p class="menu-item-description">เรียนรู้กฎหมายไทยด้วย Flashcards</p>
                    </div>
                    <div class="menu-item-arrow">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            class="arrow-icon"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </div>
                </button>

                <button @click="navigateToSections" class="menu-item">
                    <div class="menu-item-icon">📜</div>
                    <div class="menu-item-content">
                        <h3 class="menu-item-title">รายการมาตรา</h3>
                        <p class="menu-item-description">ดูรายการมาตราทั้งหมด</p>
                    </div>
                    <div class="menu-item-arrow">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            class="arrow-icon"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </div>
                </button>

                <button @click="navigateToQuizLaw" class="menu-item">
                    <div class="menu-item-icon">🎯</div>
                    <div class="menu-item-content">
                        <h3 class="menu-item-title">QuizLaw</h3>
                        <p class="menu-item-description">ทดสอบความรู้กฎหมายแบบเกม</p>
                    </div>
                    <div class="menu-item-arrow">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            class="arrow-icon"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import CacheStatus from "../components/CacheStatus.vue";
import { useDataManager } from "../composables/useDataManager";

const router = useRouter();

// Use data manager composable
const {
    isCacheAvailable,
    cacheMetadata,
    isDownloading,
    downloadSuccess,
    checkCache,
    downloadData,
} = useDataManager();

const navigateToFlashcards = () => {
    router.push({ name: "flashcard-categories" });
};

const navigateToSections = () => {
    router.push({ name: "sections-list" });
};

const navigateToQuizLaw = () => {
    router.push({ name: "quizlaw-categories" });
};

const handleDownloadData = async () => {
    await downloadData();
};

// Initialize on mount
onMounted(async () => {
    // Check if cache is available on page load
    await checkCache();
});
</script>

<style scoped>
.main-content {
    flex: 1;
    padding: 1.5rem 1rem;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

.menu-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.welcome-section {
    text-align: center;
    padding: 2rem 1rem;
}

.welcome-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
}

.welcome-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
}

.menu-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
}

.menu-item:hover {
    background: #f9fafb;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.menu-item:active {
    transform: translateY(0);
}

.menu-item-icon {
    font-size: 3rem;
    flex-shrink: 0;
}

.menu-item-content {
    flex: 1;
}

.menu-item-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
}

.menu-item-description {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
}

.menu-item-arrow {
    flex-shrink: 0;
}

.arrow-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #9ca3af;
    transition: all 0.2s;
}

.menu-item:hover .arrow-icon {
    color: #3b82f6;
    transform: translateX(4px);
}

@media (max-width: 640px) {
    .main-content {
        padding: 1rem 0.75rem;
    }

    .welcome-section {
        padding: 1.5rem 0.5rem;
    }

    .welcome-title {
        font-size: 2rem;
    }

    .welcome-subtitle {
        font-size: 1rem;
    }

    .menu-item {
        padding: 1.25rem;
    }

    .menu-item-icon {
        font-size: 2.5rem;
    }

    .menu-item-title {
        font-size: 1.25rem;
    }

    .menu-item-description {
        font-size: 0.875rem;
    }
}
</style>
