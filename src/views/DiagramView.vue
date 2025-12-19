<template>
    <main class="main-content">
        <div class="diagram-container">
            <div class="header-section">
                <h2 class="page-title">ไดอะแกรม</h2>
                <p class="page-subtitle">Diagrams</p>
            </div>

            <div v-if="diagramCategories.length === 0" class="empty-state">
                <p class="empty-message">ไม่มีไดอะแกรมในขณะนี้</p>
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
                        <p class="no-images-text">ไม่มีไดอะแกรมในหมวดนี้</p>
                    </div>

                    <div v-else class="images-grid">
                        <div
                            v-for="(image, index) in category.images"
                            :key="index"
                            class="image-card"
                        >
                            <div class="image-wrapper">
                                <img
                                    :src="getImageUrl(category.categoryPath, image.filename)"
                                    :alt="image.nameTh"
                                    class="diagram-image"
                                    @error="handleImageError"
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
    </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import diagramsConfig from "../config/diagrams.json";

interface DiagramImage {
    filename: string;
    nameTh: string;
    nameEn: string;
}

interface DiagramCategory {
    categoryId: string;
    categoryPath: string;
    nameTh: string;
    nameEn: string;
    images: DiagramImage[];
}

const diagramCategories = ref<DiagramCategory[]>([]);
const baseUrl = diagramsConfig.baseUrl;

// Fallback image SVG for when images fail to load
const FALLBACK_IMAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3EImage not available%3C/text%3E%3C/svg%3E";

/**
 * Get the full URL for an image
 */
const getImageUrl = (categoryPath: string, filename: string): string => {
    return `${baseUrl}/${categoryPath}/${filename}`;
};

/**
 * Handle image loading errors
 */
const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.src = FALLBACK_IMAGE_SVG;
};

/**
 * Load diagram categories
 */
const loadDiagrams = () => {
    // Filter categories that have images
    diagramCategories.value = diagramsConfig.diagrams.filter(
        (category) => category.images.length > 0
    );
};

onMounted(() => {
    loadDiagrams();
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
}

.diagram-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 1rem;
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
