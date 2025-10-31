<template>
    <div class="app-container">
        <!-- Header -->
        <header class="app-header">
            <div class="header-content">
                <button
                    v-if="selectedCategory"
                    @click="backToCategories"
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

        <!-- Main Content -->
        <main class="main-content" v-if="!selectedCategory">
            <LoadingSpinner v-if="isLoading" message="กำลังโหลดหมวดหมู่..." />
            <template v-else>
                <!-- Warning Banner for Fallback -->
                <div v-if="error && isUsingFallback" class="warning-banner">
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">{{ error }}</span>
                </div>
                
                <!-- Cache Status Section -->
                <div class="cache-status-section">
                    <!-- Cache Available State -->
                    <div v-if="isCacheAvailable" class="cache-info">
                        <div class="cache-header">
                            <span class="cache-icon">📦</span>
                            <h3 class="cache-title">ข้อมูลออฟไลน์</h3>
                            <span class="cache-badge success">✅ พร้อมใช้งาน</span>
                        </div>
                        <div class="cache-details">
                            <p class="cache-detail-item">
                                <span class="detail-label">อัพเดตล่าสุด:</span>
                                <span class="detail-value">{{ cacheMetadata?.lastUpdated }}</span>
                            </p>
                            <p class="cache-detail-item">
                                <span class="detail-label">จำนวนคำถาม:</span>
                                <span class="detail-value">{{ cacheMetadata?.count }} คำถาม</span>
                            </p>
                        </div>
                        <div class="cache-actions">
                            <button @click="downloadDataForOffline" :disabled="isDownloading" class="cache-btn update-btn">
                                <span v-if="!isDownloading">🔄 อัพเดตข้อมูล</span>
                                <span v-else>⏳ กำลังดาวน์โหลด...</span>
                            </button>
                            <button @click="clearOfflineData" :disabled="isDownloading" class="cache-btn clear-btn">
                                🗑️ ลบแคช
                            </button>
                        </div>
                        <!-- Success message -->
                        <div v-if="downloadSuccess" class="success-message">
                            ✅ อัพเดตข้อมูลสำเร็จ!
                        </div>
                    </div>

                    <!-- Cache Not Available State -->
                    <div v-else class="cache-info">
                        <div class="cache-header">
                            <span class="cache-icon">📦</span>
                            <h3 class="cache-title">ข้อมูลออฟไลน์</h3>
                            <span class="cache-badge warning">⚠️ ไม่พร้อมใช้งาน</span>
                        </div>
                        <p class="cache-description">
                            ดาวน์โหลดข้อมูลเพื่อใช้งานแบบออฟไลน์ได้ทุกที่ทุกเวลา
                        </p>
                        <div class="cache-actions">
                            <button @click="downloadDataForOffline" :disabled="isDownloading" class="cache-btn download-btn">
                                <span v-if="!isDownloading">⬇️ ดาวน์โหลดข้อมูล</span>
                                <span v-else>⏳ กำลังดาวน์โหลด...</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <CategorySelection
                    :categories="categoryList"
                    @select="selectCategory"
                />
            </template>
        </main>

        <main class="main-content" v-else>
            <!-- Progress Bar -->
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
                    ทำไปแล้ว {{ completedCards.size }} จากทั้งหมด
                    {{ totalCards }} ใบ
                </div>
            </div>

            <!-- Flashcard -->
            <div class="flashcard-wrapper">
                <FlashCard
                    :card="currentCard"
                    :isFlipped="isFlipped"
                    @flip="toggleFlip"
                />
            </div>

            <!-- Controls -->
            <div class="controls">
                <button
                    @click="previousCard"
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
                    @click="shuffleCards"
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
                    @click="nextCard"
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
                <button @click="resetProgress" class="reset-btn">
                    รีเซ็ตความคืบหน้า
                </button>
            </div>
        </main>

        <!-- Footer -->
        <footer class="app-footer">
            <p>สำนักกฎหมายธนธรรม ทนายธาตรี ธนธรรมสุนทร เฟซจริง</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import FlashCard from "./components/FlashCard.vue";
import CategorySelection from "./components/CategorySelection.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import { categoryStores } from "./data/categoryStores";
import { fetchCategories } from "./services/api";
import { 
  getCategoriesCache, 
  saveCategoriesCache, 
  getCacheMetadata, 
  clearCache
} from "./services/cache";
import type { Flashcard, CategoryStore, CacheMetadata } from "./types/flashcard";

// Category Management
const selectedCategory = ref<string | null>(null);
const categories = ref<CategoryStore[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isUsingFallback = ref(false);

// Cache Management
const isCacheAvailable = ref(false);
const cacheMetadata = ref<CacheMetadata | null>(null);
const isDownloading = ref(false);
const downloadSuccess = ref(false);

// Build category list from loaded categories
const categoryList = computed(() =>
    categories.value.map((store) => ({
        id: store.id,
        nameTh: store.nameTh,
        nameEn: store.nameEn,
        icon: store.icon,
        count: store.questions.length,
    })),
);

// State
const cards = ref<Flashcard[]>([]);
const currentIndex = ref(0);
const isFlipped = ref(false);
const completedCards = ref(new Set<string>());

// Computed
const currentCard = computed(() => cards.value[currentIndex.value]);
const totalCards = computed(() => cards.value.length);
const progressPercentage = computed(
    () => ((currentIndex.value + 1) / totalCards.value) * 100,
);

// Load categories on component mount
const loadCategories = async () => {
    isLoading.value = true;
    error.value = null;
    isUsingFallback.value = false;

    try {
        // First, check IndexedDB cache
        const cachedCategories = await getCategoriesCache();
        
        if (cachedCategories && cachedCategories.length > 0) {
            // Cache exists, load from cache instantly
            console.log("Loading categories from cache");
            categories.value = cachedCategories;
            isCacheAvailable.value = true;
            isLoading.value = false;
            return;
        }
        
        // No cache exists, try to fetch from API
        console.log("No cache found, fetching from API");
        const apiCategories = await fetchCategories();
        categories.value = apiCategories;
        
        // Automatically save to cache on successful API fetch
        await saveCategoriesCache(apiCategories);
        
        // Update cache metadata
        const metadata = await getCacheMetadata();
        cacheMetadata.value = metadata;
        isCacheAvailable.value = true;
    } catch (err) {
        // Fall back to static data if API fails
        console.warn(
            "Failed to load categories from API, using static data:",
            err,
        );
        categories.value = categoryStores;
        isUsingFallback.value = true;

        // Set a user-friendly message if API was expected but failed
        const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
        if (!errorMessage.includes("not configured")) {
            error.value =
                "ไม่สามารถโหลดข้อมูลจาก API ได้ กำลังใช้ข้อมูลแบบออฟไลน์";
            // Clear error after 5 seconds so user can continue
            setTimeout(() => {
                error.value = null;
            }, 5000);
        }
    } finally {
        isLoading.value = false;
    }
};

// Category Selection Methods
const selectCategory = (categoryId: string) => {
    selectedCategory.value = categoryId;
    // Find the selected category store and load its questions
    const selectedStore = categories.value.find(
        (store) => store.id === categoryId,
    );
    if (selectedStore) {
        cards.value = [...selectedStore.questions];
    }
    currentIndex.value = 0;
    isFlipped.value = false;
    completedCards.value.clear();
};

// Download data for offline use
const downloadDataForOffline = async () => {
    isDownloading.value = true;
    downloadSuccess.value = false;
    error.value = null;
    
    try {
        // Force fetch from API (ignore cache)
        console.log("Downloading data for offline use...");
        const apiCategories = await fetchCategories();
        
        // Save to IndexedDB on success
        await saveCategoriesCache(apiCategories);
        
        // Update categories and cache metadata
        categories.value = apiCategories;
        const metadata = await getCacheMetadata();
        cacheMetadata.value = metadata;
        isCacheAvailable.value = true;
        
        // Show success message for 5 seconds
        downloadSuccess.value = true;
        setTimeout(() => {
            downloadSuccess.value = false;
        }, 5000);
        
        console.log("Data downloaded and cached successfully");
    } catch (err) {
        console.error("Failed to download data:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        
        if (errorMessage.includes("not configured")) {
            error.value = "API ไม่ได้ถูกกำหนดค่า ไม่สามารถดาวน์โหลดข้อมูลได้";
        } else {
            error.value = "ไม่สามารถดาวน์โหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
        }
        
        setTimeout(() => {
            error.value = null;
        }, 5000);
    } finally {
        isDownloading.value = false;
    }
};

// Clear offline data
const clearOfflineData = async () => {
    if (!confirm("คุณต้องการลบข้อมูลออฟไลน์หรือไม่?")) {
        return;
    }
    
    try {
        await clearCache();
        
        // Reset cache-related states
        isCacheAvailable.value = false;
        cacheMetadata.value = null;
        
        console.log("Offline data cleared successfully");
        
        // Optionally reload categories from API or static data
        await loadCategories();
    } catch (err) {
        console.error("Failed to clear cache:", err);
        error.value = "ไม่สามารถลบแคชได้";
        setTimeout(() => {
            error.value = null;
        }, 5000);
    }
};

// Initialize categories on mount
onMounted(async () => {
    // Load cache metadata
    const metadata = await getCacheMetadata();
    if (metadata) {
        cacheMetadata.value = metadata;
        isCacheAvailable.value = true;
    }
    
    // Load categories
    await loadCategories();
});

const backToCategories = () => {
    selectedCategory.value = null;
    cards.value = [];
    currentIndex.value = 0;
    isFlipped.value = false;
    completedCards.value.clear();
};

// Methods
const toggleFlip = () => {
    isFlipped.value = !isFlipped.value;
    if (isFlipped.value) {
        completedCards.value.add(currentCard.value.id);
    }
};

const nextCard = () => {
    if (currentIndex.value < totalCards.value - 1) {
        currentIndex.value++;
        isFlipped.value = false;
    }
};

const previousCard = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        isFlipped.value = false;
    }
};

const shuffleCards = () => {
    const shuffled = [...cards.value];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    cards.value = shuffled;
    currentIndex.value = 0;
    isFlipped.value = false;
};

const resetProgress = () => {
    completedCards.value.clear();
    currentIndex.value = 0;
    isFlipped.value = false;
};
</script>

<style scoped>
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
}

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

.main-content {
    flex: 1;
    padding: 1.5rem 1rem;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

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

.flashcard-wrapper {
    width: 100%;
    margin-bottom: 1.5rem;
}

.controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;
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

.warning-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background-color: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    color: #92400e;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.warning-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.warning-text {
    font-size: 0.875rem;
    font-weight: 500;
    flex: 1;
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

    .main-content {
        padding: 1rem 0.75rem;
    }

    .flashcard-wrapper {
        width: 100%;
    }

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

/* Cache Status Section Styles */
.cache-status-section {
    margin-bottom: 1.5rem;
}

.cache-info {
    background: white;
    border-radius: 0.75rem;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
}

.cache-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.cache-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.cache-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    flex-grow: 1;
}

.cache-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}

.cache-badge.success {
    background-color: #d1fae5;
    color: #065f46;
}

.cache-badge.warning {
    background-color: #fef3c7;
    color: #92400e;
}

.cache-details {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
}

.cache-detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0.375rem 0;
    font-size: 0.875rem;
}

.detail-label {
    color: #6b7280;
    font-weight: 500;
}

.detail-value {
    color: #1f2937;
    font-weight: 600;
}

.cache-description {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
}

.cache-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.cache-btn {
    flex: 1;
    min-width: 140px;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    color: white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.cache-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.cache-btn:active:not(:disabled) {
    transform: translateY(0);
}

.cache-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.update-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.update-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.clear-btn {
    background-color: #ef4444;
    flex: 0.5;
}

.clear-btn:hover:not(:disabled) {
    background-color: #dc2626;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.download-btn {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.download-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.success-message {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background-color: #d1fae5;
    color: #065f46;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 640px) {
    .cache-info {
        padding: 1rem;
    }

    .cache-header {
        gap: 0.5rem;
    }

    .cache-icon {
        font-size: 1.25rem;
    }

    .cache-title {
        font-size: 1rem;
    }

    .cache-badge {
        font-size: 0.625rem;
        padding: 0.25rem 0.5rem;
    }

    .cache-actions {
        flex-direction: column;
    }

    .cache-btn {
        width: 100%;
        min-width: auto;
    }

    .clear-btn {
        flex: 1;
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
