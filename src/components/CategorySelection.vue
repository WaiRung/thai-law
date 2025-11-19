<template>
    <div class="category-container">
        <div class="category-header">
            <h2 class="category-title">เลือกหมวดกฎหมาย</h2>
            <p class="category-subtitle">Select Law Category</p>
        </div>

        <div class="category-grid">
            <button
                v-for="category in categories"
                :key="category.id"
                @click="selectCategory(category.id)"
                class="category-card"
            >
                <div class="category-icon">{{ category.icon }}</div>
                <div class="category-name-th">{{ category.nameTh }}</div>
                <div class="category-name-en">{{ category.nameEn }}</div>
                <div class="category-count">{{ category.count }} คำถาม</div>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Category {
    id: string;
    nameTh: string;
    nameEn: string;
    icon: string;
    count: number;
}

interface Props {
    categories: Category[];
}

defineProps<Props>();

const emit = defineEmits<{
    select: [categoryId: string];
}>();

const selectCategory = (categoryId: string) => {
    emit("select", categoryId);
};
</script>

<style scoped>
.category-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 2rem 1rem;
    max-width: 800px;
    margin: 0 auto;
}

.category-header {
    text-align: center;
    margin-bottom: 2rem;
}

.category-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    margin-bottom: 0.5rem;
}

.category-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
}

.category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    width: 100%;
}

.category-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    padding: 2rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
}

.category-card:active {
    transform: translateY(-2px);
}

.category-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.category-name-th {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.category-name-en {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1rem;
}

.category-count {
    font-size: 0.875rem;
    color: #3b82f6;
    font-weight: 600;
    padding: 0.375rem 0.75rem;
    background-color: #eff6ff;
    border-radius: 9999px;
}

@media (max-width: 640px) {
    .category-container {
        padding: 1.5rem 1rem;
    }

    .category-title {
        font-size: 1.5rem;
    }

    .category-subtitle {
        font-size: 1rem;
    }

    .category-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .category-card {
        padding: 1.5rem 1rem;
    }

    .category-icon {
        font-size: 2.5rem;
    }

    .category-name-th {
        font-size: 1.125rem;
    }
}
</style>
