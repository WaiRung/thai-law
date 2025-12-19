<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <div class="modal-content">
            <div class="modal-header">
              <div class="image-info">
                <h2 class="image-title">{{ title }}</h2>
                <p v-if="subtitle" class="image-subtitle">{{ subtitle }}</p>
              </div>
              <button class="close-button" @click="handleClose" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="isImageLoading" class="modal-loading">
                <div class="spinner"></div>
                <p class="loading-text">กำลังโหลดภาพขนาดเต็ม...</p>
              </div>
              <img 
                :src="imageUrl" 
                :alt="title" 
                class="fullscreen-image"
                :class="{ 'image-loaded': !isImageLoading }"
                @load="handleImageLoad"
                @error="handleImageError"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";

interface Props {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  subtitle?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

// Constant for minimum spinner display time
const MODAL_SPINNER_MIN_DISPLAY_TIME = 150;

const isImageLoading = ref(true);

const handleClose = () => {
  emit("close");
};

const handleImageLoad = async (event: Event) => {
  const img = event.target as HTMLImageElement;
  
  try {
    // Wait for the image to be fully decoded
    await img.decode();
    
    // Add a small delay to prevent spinner flash
    await new Promise(resolve => setTimeout(resolve, MODAL_SPINNER_MIN_DISPLAY_TIME));
    
    isImageLoading.value = false;
  } catch (error) {
    console.error('Image decode error:', error);
    isImageLoading.value = false;
  }
};

const handleImageError = () => {
  isImageLoading.value = false;
};

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.isOpen) {
    handleClose();
  }
};

// Reset loading state when modal opens with new image
watch(
  () => props.imageUrl,
  () => {
    if (props.isOpen) {
      isImageLoading.value = true;
    }
  }
);

// Prevent body scroll when modal is open
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      isImageLoading.value = true;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);

onMounted(() => {
  window.addEventListener("keydown", handleEscKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscKey);
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

.image-info {
  flex: 1;
}

.image-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
}

.image-subtitle {
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
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 1;
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

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.fullscreen-image.image-loaded {
  opacity: 1;
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

  .image-title {
    font-size: 1.25rem;
  }

  .image-subtitle {
    font-size: 0.875rem;
  }

  .modal-body {
    padding: 1rem;
  }
}
</style>
