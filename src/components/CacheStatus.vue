<template>
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
                    <span class="detail-value">{{
                        cacheMetadata?.lastUpdated
                    }}</span>
                </p>
                <p class="cache-detail-item">
                    <span class="detail-label">จำนวนมาตรา:</span>
                    <span class="detail-value"
                        >{{ cacheMetadata?.count }} มาตรา</span
                    >
                </p>
            </div>
            <div class="cache-actions">
                <button
                    @click="handleReload"
                    :disabled="isDownloading"
                    class="cache-btn reload-btn"
                >
                    <span v-if="!isDownloading">🔄 โหลดข้อมูลใหม่</span>
                    <span v-else>⏳ กำลังโหลด...</span>
                </button>
            </div>
            <!-- Success message -->
            <div v-if="downloadSuccess" class="success-message">
                ✅ โหลดข้อมูลใหม่สำเร็จ!
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
                <button
                    @click="handleReload"
                    :disabled="isDownloading"
                    class="cache-btn download-btn"
                >
                    <span v-if="!isDownloading">⬇️ ดาวน์โหลดข้อมูล</span>
                    <span v-else>⏳ กำลังดาวน์โหลด...</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { CacheMetadata } from "../types/flashcard";

interface Props {
    isCacheAvailable: boolean;
    cacheMetadata: CacheMetadata | null;
    isDownloading: boolean;
    downloadSuccess: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
    reload: [];
}>();

const handleReload = () => {
    emit("reload");
};
</script>

<style scoped>
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

.reload-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.reload-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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
}
</style>
