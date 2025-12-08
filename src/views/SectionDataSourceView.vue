<template>
    <main class="main-content">
        <LoadingSpinner v-if="isLoading" message="กำลังโหลดข้อมูล..." />
        <template v-else-if="category">
            <DataSourceSelection
                :category-name="category.nameTh"
                :data-sources="category.dataSources || []"
                @select="selectDataSource"
            />
        </template>
    </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import DataSourceSelection from "../components/DataSourceSelection.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { categoryStores } from "../data/categoryStores";
import { useDataManager } from "../composables/useDataManager";
import { useHeader } from "../composables/useHeader";
import type { CategoryStore } from "../types/flashcard";

const router = useRouter();
const route = useRoute();
const { setHeader, resetHeader } = useHeader();
const { loadCategories } = useDataManager();

const categoryId = route.params.categoryId as string;
const isLoading = ref(true);
const category = ref<CategoryStore | null>(null);

const loadCategoryData = async () => {
    isLoading.value = true;
    try {
        const loadedCategories = await loadCategories();
        const categories = loadedCategories || categoryStores;
        
        category.value = categories.find((c) => c.id === categoryId) || null;
        
        if (!category.value) {
            console.warn(`Category not found: ${categoryId}`);
            router.replace({ name: "sections-list" });
            return;
        }

        // Set header
        setHeader(category.value.nameTh, category.value.nameEn);
    } catch (err) {
        console.error("Failed to load category:", err);
        router.replace({ name: "sections-list" });
    } finally {
        isLoading.value = false;
    }
};

const selectDataSource = (dataSourceIndex: number) => {
    router.push({
        name: "sections-detail",
        params: { categoryId, dataSourceIndex: String(dataSourceIndex) },
    });
};

onMounted(async () => {
    await loadCategoryData();
});

onUnmounted(() => {
    resetHeader();
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

@media (max-width: 640px) {
    .main-content {
        padding: 1rem 0.75rem;
    }
}
</style>
