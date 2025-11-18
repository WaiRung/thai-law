<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังโหลดรายการมาตรา..." />
        <template v-else>
            <div class="sections-container">
                <div class="header-section">
                    <h2 class="title">รายการมาตรา</h2>
                    <p class="subtitle">Sections List</p>
                </div>

                <div
                    v-for="category in categorySections"
                    :key="category.categoryId"
                    class="category-section"
                >
                    <h3 class="category-title">{{ category.categoryName }}</h3>
                    <div class="sections-list">
                        <div
                            v-for="section in category.sections"
                            :key="section.id"
                            class="section-item"
                        >
                            <div class="section-header">{{ section.id }}</div>
                            <div class="section-answer">{{ section.answer }}</div>
                        </div>
                    </div>
                </div>

                <div v-if="categorySections.length === 0" class="empty-state">
                    <p>ไม่พบข้อมูลมาตรา</p>
                </div>
            </div>
        </template>
    </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { getAllSections } from "../services/sectionService";

interface SectionContent {
    id: string;
    question: string;
    answer: string;
}

interface CategorySections {
    categoryId: string;
    categoryName: string;
    sections: SectionContent[];
}

const isLoading = ref(true);
const categorySections = ref<CategorySections[]>([]);

const loadSections = async () => {
    isLoading.value = true;
    try {
        categorySections.value = await getAllSections();
    } catch (error) {
        console.error("Failed to load sections:", error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadSections();
});
</script>

<style scoped>
.main-content {
    flex: 1;
    padding: 1.5rem 1rem;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

.sections-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.header-section {
    text-align: center;
    padding: 1rem 0;
}

.title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
}

.subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
}

.category-section {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.5rem;
}

.category-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;
}

.sections-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.section-item {
    padding: 1.5rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    transition: all 0.2s;
}

.section-item:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.section-header {
    font-size: 1rem;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 0.75rem;
}

.section-answer {
    font-size: 0.875rem;
    color: #1f2937;
    line-height: 1.8;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
    font-size: 1rem;
}

@media (max-width: 640px) {
    .main-content {
        padding: 1rem 0.75rem;
    }

    .title {
        font-size: 1.5rem;
    }

    .subtitle {
        font-size: 1rem;
    }

    .category-section {
        padding: 1rem;
    }

    .sections-list {
        gap: 1rem;
    }

    .section-item {
        padding: 1rem;
        font-size: 0.8125rem;
    }

    .section-header {
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .section-answer {
        font-size: 0.8125rem;
    }
}
</style>
