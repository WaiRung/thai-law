<template>
    <main class="main-content">
        <div class="diagram-container">
            <div class="header-section">
                <h2 class="page-title">Diagrams</h2>
                <p class="page-subtitle">Diagrams</p>
            </div>

            <div v-if="diagramCategories.length === 0" class="empty-state">
                <p class="empty-message">ไม่มี Diagrams ในขณะนี้</p>
                <p class="empty-submessage">No diagrams available at the moment</p>
            </div>

            <div v-else class="categories-list">
                <div
                    v-for="category in diagramCategories"
                    :key="category.categoryId"
                    class="category-section"
                >
                    <div class="category-header">
                        <h3 class="category-title">{{ category.nameTh }}</h3>
                        <p class="category-subtitle">{{ category.nameEn }}</p>
                    </div>

                    <div v-if="category.images.length === 0" class="no-images">
                        <p class="no-images-text">ไม่มีไ Diagrams ในหมวดนี้</p>
                    </div>

                    <div v-else class="images-grid">
                        <div
                            v-for="(image, index) in category.images"
                            :key="index"
                            class="image-card"
                        >
                            <div class="image-wrapper" @click="openImageModal(category, image)">
                                <div v-if="isImageLoading(category.categoryId, index)" class="loading-overlay">
                                    <div class="spinner"></div>
                                    <p class="loading-text">กำลังโหลด...</p>
                                </div>
                                <img
                                    :src="getImageUrlSync(category.categoryId, image.filename)"
                                    :alt="image.nameTh"
                                    class="diagram-image"
                                    :class="{ 'image-loaded': !isImageLoading(category.categoryId, index) }"
                                    @load="handleImageLoad($event, category.categoryId, index)"
                                    @error="handleImageError($event, category.categoryId, index)"
                                />
                            </div>
                            <div class="image-info">
                                <p class="image-title">{{ image.nameTh }}</p>
                                <p class="image-subtitle">{{ image.nameEn }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Image Modal -->
        <ImageModal
            :is-open="isModalOpen"
            :image-url="selectedImage.url"
            :title="selectedImage.title"
            :subtitle="selectedImage.subtitle"
            @close="closeImageModal"
        />
    </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import diagramsConfig from "../config/diagrams.json";
import ImageModal from "../components/ImageModal.vue";
import { getCachedDiagramImage } from "../services/diagramService";
import type { DiagramImage, DiagramCategory } from "../types/diagram";

interface ImageLoadingState {
    [key: string]: boolean;
}

interface ImageUrlCache {
    [key: string]: string;
}

// Constant for loading behavior
const SPINNER_MIN_DISPLAY_TIME = 100; // Minimum time to show spinner to prevent flashing

const diagramCategories = ref<DiagramCategory[]>([]);
const baseUrl = diagramsConfig.baseUrl;
const imageLoadingStates = ref<ImageLoadingState>({});
const imageUrlCache = ref<ImageUrlCache>({});
const isModalOpen = ref(false);
const selectedImage = ref({
    url: "",
    title: "",
    subtitle: ""
});

// Fallback image SVG for when images fail to load
const FALLBACK_IMAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3EImage not available%3C/text%3E%3C/svg%3E";

/**
 * Generate unique key for image loading state
 */
const getImageKey = (categoryId: string, imageIndex: number): string => {
    return `${categoryId}-${imageIndex}`;
};

/**
 * Check if an image is currently loading
 */
const isImageLoading = (categoryId: string, imageIndex: number): boolean => {
    const key = getImageKey(categoryId, imageIndex);
    return imageLoadingStates.value[key] ?? true;
};

/**
 * Get the full URL for an image
 * First checks cache for Base64 data, falls back to remote URL
 */
const getImageUrl = async (categoryId: string, categoryPath: string, filename: string): Promise<string> => {
    const key = `${categoryId}-${filename}`;
    
    // Return from URL cache if already loaded
    if (imageUrlCache.value[key]) {
        return imageUrlCache.value[key];
    }
    
    // Try to get cached image first
    const cachedImage = await getCachedDiagramImage(categoryId, filename);
    if (cachedImage) {
        imageUrlCache.value[key] = cachedImage;
        return cachedImage;
    }
    
    // Fall back to remote URL
    const remoteUrl = `${baseUrl}/${categoryPath}/${filename}`;
    imageUrlCache.value[key] = remoteUrl;
    return remoteUrl;
};

/**
 * Get image URL synchronously from cache
 */
const getImageUrlSync = (categoryId: string, filename: string): string => {
    const key = `${categoryId}-${filename}`;
    return imageUrlCache.value[key] || FALLBACK_IMAGE_SVG;
};

/**
 * Handle image loading success
 * Uses decode() to ensure the image is fully decoded before hiding the spinner
 */
const handleImageLoad = async (event: Event, categoryId: string, imageIndex: number) => {
    const img = event.target as HTMLImageElement;
    const key = getImageKey(categoryId, imageIndex);
    
    try {
        // Wait for the image to be fully decoded
        // This ensures large images are completely ready before removing the spinner
        await img.decode();
        
        // Add a small delay to prevent spinner flash for very fast loads
        await new Promise(resolve => setTimeout(resolve, SPINNER_MIN_DISPLAY_TIME));
        
        imageLoadingStates.value[key] = false;
    } catch (error) {
        // If decode fails, still hide the spinner
        console.error('Image decode error:', error);
        imageLoadingStates.value[key] = false;
    }
};

/**
 * Handle image loading errors
 */
const handleImageError = (event: Event, categoryId: string, imageIndex: number) => {
    const img = event.target as HTMLImageElement;
    img.src = FALLBACK_IMAGE_SVG;
    const key = getImageKey(categoryId, imageIndex);
    imageLoadingStates.value[key] = false;
};

/**
 * Open image in fullscreen modal
 */
const openImageModal = async (category: DiagramCategory, image: DiagramImage) => {
    selectedImage.value = {
        url: await getImageUrl(category.categoryId, category.categoryPath, image.filename),
        title: image.nameTh,
        subtitle: image.nameEn
    };
    isModalOpen.value = true;
};

/**
 * Close the image modal
 */
const closeImageModal = () => {
    isModalOpen.value = false;
};

/**
 * Load diagram categories and initialize loading states
 */
const loadDiagrams = async () => {
    // Filter categories that have images
    diagramCategories.value = diagramsConfig.diagrams.filter(
        (category) => category.images.length > 0
    );

    // Initialize loading states and preload image URLs
    for (const category of diagramCategories.value) {
        for (let index = 0; index < category.images.length; index++) {
            const key = getImageKey(category.categoryId, index);
            imageLoadingStates.value[key] = true;
            
            // Preload image URL (cache lookup or remote URL)
            const image = category.images[index];
            await getImageUrl(category.categoryId, category.categoryPath, image.filename);
        }
    }
};

onMounted(async () => {
    await loadDiagrams();
});
</script>

<style scoped>
.main-content {
    flex: 1;
    padding: 1.5rem 1rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

.diagram-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.header-section {
    text-align: center;
    padding: 1rem 0 2rem;
}

.page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
}

.page-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: white;
    border-radius: 1rem;
    border: 2px solid #e5e7eb;
}

.empty-message {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
}

.empty-submessage {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
}

.categories-list {
    display: flex;
    flex-direction: column;
    gap: 3rem;
}

.category-section {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    border: 2px solid #e5e7eb;
}

.category-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
}

.category-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
}

.category-subtitle {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
}

.no-images {
    text-align: center;
    padding: 2rem 1rem;
}

.no-images-text {
    font-size: 1rem;
    color: #9ca3af;
    margin: 0;
}

.images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.image-card {
    display: flex;
    flex-direction: column;
    background: #f9fafb;
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
}

.image-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.image-wrapper {
    width: 100%;
    height: 250px;
    overflow: hidden;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    transition: opacity 0.2s;
}

.image-wrapper:hover {
    opacity: 0.9;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    gap: 0.75rem;
}

.spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
}

.diagram-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 1rem;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
}

.diagram-image.image-loaded {
    opacity: 1;
}

.image-info {
    padding: 1rem;
}

.image-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
}

.image-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
}

@media (max-width: 768px) {
    .main-content {
        padding: 1rem 0.75rem;
    }

    .header-section {
        padding: 0.5rem 0 1.5rem;
    }

    .page-title {
        font-size: 2rem;
    }

    .page-subtitle {
        font-size: 1rem;
    }

    .category-section {
        padding: 1.5rem;
    }

    .category-title {
        font-size: 1.5rem;
    }

    .images-grid {
        grid-template-columns: 1fr;
    }

    .image-wrapper {
        height: 200px;
    }
}

@media (max-width: 640px) {
    .page-title {
        font-size: 1.75rem;
    }

    .category-title {
        font-size: 1.25rem;
    }

    .category-section {
        padding: 1rem;
    }
}
</style>
