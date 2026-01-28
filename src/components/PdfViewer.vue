<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <div class="modal-content">
            <div class="modal-header">
              <div class="pdf-info">
                <h2 class="pdf-title">{{ title }}</h2>
                <p v-if="subtitle" class="pdf-subtitle">{{ subtitle }}</p>
              </div>
              <button class="close-button" @click="handleClose" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div class="modal-body">
              <div v-if="isLoading" class="modal-loading">
                <div class="spinner"></div>
                <p class="loading-text">กำลังโหลด PDF...</p>
              </div>
              
              <div v-else-if="error" class="error-container">
                <div class="error-icon">⚠️</div>
                <p class="error-text">{{ error }}</p>
                <button class="retry-button" @click="loadPdf">ลองใหม่อีกครั้ง</button>
              </div>
              
              <div v-else class="pdf-container" ref="pdfContainerRef">
                <canvas ref="canvasRef" class="pdf-canvas"></canvas>
              </div>
            </div>
            
            <div v-if="!isLoading && !error" class="modal-footer">
              <div class="controls-group">
                <button 
                  class="control-button"
                  @click="previousPage"
                  :disabled="currentPage <= 1"
                  aria-label="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                
                <div class="page-info">
                  <span class="page-current">{{ currentPage }}</span>
                  <span class="page-separator">/</span>
                  <span class="page-total">{{ totalPages }}</span>
                </div>
                
                <button 
                  class="control-button"
                  @click="nextPage"
                  :disabled="currentPage >= totalPages"
                  aria-label="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
              
              <div class="controls-group">
                <button 
                  class="control-button"
                  @click="zoomOut"
                  :disabled="zoomLevel <= 0.5"
                  aria-label="Zoom out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                
                <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                
                <button 
                  class="control-button"
                  @click="zoomIn"
                  :disabled="zoomLevel >= 3.0"
                  aria-label="Zoom in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
              
              <div class="controls-group">
                <button 
                  class="control-button"
                  @click="downloadPdf"
                  aria-label="Download PDF"
                  title="ดาวน์โหลด PDF"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                
                <button 
                  class="control-button"
                  @click="toggleFullscreen"
                  aria-label="Toggle fullscreen"
                  :title="isFullscreen ? 'ออกจากโหมดเต็มหน้าจอ' : 'โหมดเต็มหน้าจอ'"
                >
                  <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted, onUnmounted } from "vue";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

interface Props {
  isOpen: boolean;
  pdfUrl: string;
  title: string;
  subtitle?: string;
  filename?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const isLoading = ref(false);
const error = ref<string | null>(null);
const pdfDocument = shallowRef<any>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const zoomLevel = ref(1.0);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const pdfContainerRef = ref<HTMLDivElement | null>(null);
const isFullscreen = ref(false);

const handleClose = () => {
  emit("close");
};

const loadPdf = async () => {
  if (!props.pdfUrl) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    let documentSource: any = props.pdfUrl;
    
    // If it's a base64 data URL (from offline cache), convert to Uint8Array
    // PDF.js handles Uint8Array more reliably for offline viewing
    if (props.pdfUrl.startsWith('data:application/pdf;base64,')) {
      const base64Data = props.pdfUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      documentSource = bytes;
    }
    
    const loadingTask = pdfjsLib.getDocument(documentSource);
    pdfDocument.value = await loadingTask.promise;
    totalPages.value = pdfDocument.value.numPages;
    currentPage.value = 1;
    await renderPage(1);
  } catch (err) {
    console.error("Error loading PDF:", err);
    error.value = "ไม่สามารถโหลด PDF ได้ / Failed to load PDF";
  } finally {
    isLoading.value = false;
  }
};

const renderPage = async (pageNumber: number) => {
  if (!pdfDocument.value || !canvasRef.value) return;
  
  try {
    const page = await pdfDocument.value.getPage(pageNumber);
    const viewport = page.getViewport({ scale: zoomLevel.value });
    
    const canvas = canvasRef.value;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
  } catch (err) {
    console.error("Error rendering page:", err);
    error.value = "ไม่สามารถแสดงหน้านี้ได้ / Failed to render page";
  }
};

const previousPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    await renderPage(currentPage.value);
  }
};

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    await renderPage(currentPage.value);
  }
};

const zoomIn = async () => {
  if (zoomLevel.value < 3.0) {
    zoomLevel.value = Math.min(3.0, zoomLevel.value + 0.25);
    await renderPage(currentPage.value);
  }
};

const zoomOut = async () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25);
    await renderPage(currentPage.value);
  }
};

const downloadPdf = () => {
  const link = document.createElement("a");
  link.href = props.pdfUrl;
  link.download = props.filename || "document.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const toggleFullscreen = async () => {
  const elem = document.querySelector(".modal-container") as HTMLElement;
  
  if (!document.fullscreenElement) {
    try {
      await elem?.requestFullscreen();
      isFullscreen.value = true;
    } catch (err) {
      console.error("Error entering fullscreen:", err);
    }
  } else {
    try {
      await document.exitFullscreen();
      isFullscreen.value = false;
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }
  };
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.isOpen && !document.fullscreenElement) {
    handleClose();
  }
};

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      loadPdf();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      pdfDocument.value = null;
      currentPage.value = 1;
      totalPages.value = 0;
      zoomLevel.value = 1.0;
      error.value = null;
      isFullscreen.value = false;
    }
  }
);

watch(
  () => props.pdfUrl,
  () => {
    if (props.isOpen) {
      loadPdf();
    }
  }
);

onMounted(() => {
  window.addEventListener("keydown", handleEscKey);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscKey);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.body.style.overflow = "";
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  background: #1f2937;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

.pdf-info {
  flex: 1;
}

.pdf-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
}

.pdf-subtitle {
  font-size: 1rem;
  color: #9ca3af;
  margin: 0;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 1rem;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-button:active {
  transform: scale(0.95);
}

.modal-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow: auto;
  position: relative;
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(255, 255, 255, 0.2);
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
  font-size: 1rem;
  color: #9ca3af;
  margin: 0;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.error-icon {
  font-size: 3rem;
}

.error-text {
  font-size: 1rem;
  color: #ef4444;
  margin: 0;
  text-align: center;
}

.retry-button {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: 600;
}

.retry-button:hover {
  background: #2563eb;
}

.retry-button:active {
  transform: scale(0.98);
}

.pdf-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.pdf-canvas {
  max-width: 100%;
  height: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  gap: 1rem;
  flex-wrap: wrap;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.control-button:active:not(:disabled) {
  transform: scale(0.95);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: white;
  font-size: 1rem;
  padding: 0 0.5rem;
}

.page-current {
  font-weight: 600;
}

.page-separator {
  color: #9ca3af;
}

.page-total {
  color: #9ca3af;
}

.zoom-level {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 4rem;
  text-align: center;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-container {
    max-width: 100%;
    max-height: 100vh;
  }

  .modal-content {
    border-radius: 0;
    height: 100vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .pdf-title {
    font-size: 1.25rem;
  }

  .pdf-subtitle {
    font-size: 0.875rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    justify-content: center;
  }

  .controls-group {
    gap: 0.25rem;
  }
}
</style>
