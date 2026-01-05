<template>
    <main class="main-content">
        <div class="document-container">
            <div class="header-section">
                <h2 class="page-title">Documents</h2>
                <p class="page-subtitle">เอกสาร PDF</p>
            </div>

            <div v-if="documentCategories.length === 0" class="empty-state">
                <p class="empty-message">ไม่มีเอกสารในขณะนี้</p>
                <p class="empty-submessage">No documents available at the moment</p>
            </div>

            <div v-else class="categories-list">
                <div
                    v-for="category in documentCategories"
                    :key="category.categoryId"
                    class="category-section"
                >
                    <div class="category-header">
                        <h3 class="category-title">{{ category.nameTh }}</h3>
                        <p class="category-subtitle">{{ category.nameEn }}</p>
                    </div>

                    <div v-if="category.files.length === 0" class="no-files">
                        <p class="no-files-text">ไม่มีเอกสารในหมวดนี้</p>
                    </div>

                    <div v-else class="files-grid">
                        <div
                            v-for="(file, index) in category.files"
                            :key="index"
                            class="file-card"
                            @click="openDocument(category, file)"
                        >
                            <div class="file-icon">📄</div>
                            <div class="file-info">
                                <p class="file-title">{{ file.nameTh }}</p>
                                <p class="file-subtitle">{{ file.nameEn }}</p>
                            </div>
                            <div class="file-arrow">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import documentsConfig from "../config/documents.json";
import { getCachedDocument } from "../services/documentService";
import type { DocumentFile, DocumentCategory } from "../types/document";

const documentCategories = ref<DocumentCategory[]>([]);
const baseUrl = documentsConfig.baseUrl;

/**
 * Get the full URL for a document
 * First checks cache for Base64 data, falls back to remote URL
 */
const getDocumentUrl = async (categoryId: string, categoryPath: string, filename: string): Promise<string> => {
    // Try to get cached document first
    const cachedDocument = await getCachedDocument(categoryId, filename);
    if (cachedDocument) {
        return cachedDocument;
    }
    
    // Fall back to remote URL
    return `${baseUrl}/${categoryPath}/${filename}`;
};

/**
 * Open document in new tab/window
 */
const openDocument = async (category: DocumentCategory, file: DocumentFile) => {
    try {
        const documentUrl = await getDocumentUrl(category.categoryId, category.categoryPath, file.filename);
        
        // Open PDF in new tab
        window.open(documentUrl, '_blank');
    } catch (error) {
        console.error('Error opening document:', error);
        alert('ไม่สามารถเปิดเอกสารได้ / Cannot open document');
    }
};

/**
 * Load document categories
 */
const loadDocuments = () => {
    // Filter categories that have files
    documentCategories.value = documentsConfig.documents.filter(
        (category) => category.files.length > 0
    );
};

onMounted(() => {
    loadDocuments();
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

.document-container {
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

.no-files {
    text-align: center;
    padding: 2rem 1rem;
}

.no-files-text {
    font-size: 1rem;
    color: #9ca3af;
    margin: 0;
}

.files-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.file-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
}

.file-card:hover {
    background: white;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.file-card:active {
    transform: translateY(0);
}

.file-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
}

.file-info {
    flex: 1;
}

.file-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
}

.file-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
}

.file-arrow {
    flex-shrink: 0;
}

.arrow-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #9ca3af;
    transition: all 0.2s;
}

.file-card:hover .arrow-icon {
    color: #3b82f6;
    transform: translateX(4px);
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

    .file-card {
        padding: 1rem;
    }

    .file-icon {
        font-size: 2rem;
    }

    .file-title {
        font-size: 1rem;
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
