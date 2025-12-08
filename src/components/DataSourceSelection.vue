<template>
    <div class="datasource-container">
        <div class="datasource-header">
            <h2 class="datasource-title">{{ categoryName }}</h2>
            <p class="datasource-subtitle">เลือกแหล่งข้อมูล / Select Data Source</p>
        </div>

        <div class="datasource-grid">
            <button
                v-for="(dataSource, index) in dataSources"
                :key="index"
                @click="selectDataSource(index)"
                class="datasource-card"
            >
                <div class="datasource-icon">📚</div>
                <div class="datasource-name-th">{{ dataSource.nameTh || `แหล่งข้อมูล ${index + 1}` }}</div>
                <div class="datasource-name-en">{{ dataSource.nameEn || `Data Source ${index + 1}` }}</div>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DataSource } from "../types/flashcard";

interface Props {
    categoryName: string;
    dataSources: DataSource[];
}

defineProps<Props>();

const emit = defineEmits<{
    select: [dataSourceIndex: number];
}>();

const selectDataSource = (dataSourceIndex: number) => {
    emit("select", dataSourceIndex);
};
</script>

<style scoped>
.datasource-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 2rem 1rem;
    max-width: 800px;
    margin: 0 auto;
}

.datasource-header {
    text-align: center;
    margin-bottom: 2rem;
}

.datasource-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    margin-bottom: 0.5rem;
}

.datasource-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
}

.datasource-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    width: 100%;
}

.datasource-card {
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

.datasource-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
}

.datasource-card:active {
    transform: translateY(-2px);
}

.datasource-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.datasource-name-th {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.datasource-name-en {
    font-size: 0.875rem;
    color: #6b7280;
}

@media (max-width: 640px) {
    .datasource-container {
        padding: 1.5rem 1rem;
    }

    .datasource-title {
        font-size: 1.5rem;
    }

    .datasource-subtitle {
        font-size: 1rem;
    }

    .datasource-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .datasource-card {
        padding: 1.5rem 1rem;
    }

    .datasource-icon {
        font-size: 2.5rem;
    }

    .datasource-name-th {
        font-size: 1.125rem;
    }
}
</style>
