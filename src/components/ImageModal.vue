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
                ref="imageElement"
                :src="imageUrl" 
                :alt="title" 
                class="fullscreen-image"
                :class="{ 'image-loaded': !isImageLoading }"
                :style="imageTransformStyle"
                @load="handleImageLoad"
                @error="handleImageError"
                @touchstart="handleTouchStart"
                @touchmove="handleTouchMove"
                @touchend="handleTouchEnd"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";

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
const imageElement = ref<HTMLImageElement | null>(null);

// Touch and zoom state
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const lastTouchDistance = ref(0);
const lastTouchCenter = ref({ x: 0, y: 0 });
const isPinching = ref(false);

// Computed style for image transform
const imageTransformStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: 'center center',
  transition: isPinching.value ? 'none' : 'transform 0.2s ease-out'
}));

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

// Calculate distance between two touch points
const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Calculate center point between two touches
const getTouchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
};

// Handle touch start
const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    event.preventDefault();
    isPinching.value = true;
    lastTouchDistance.value = getTouchDistance(event.touches[0], event.touches[1]);
    lastTouchCenter.value = getTouchCenter(event.touches[0], event.touches[1]);
  }
};

// Handle touch move for pinch zoom and pan
const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    event.preventDefault();
    
    const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
    const currentCenter = getTouchCenter(event.touches[0], event.touches[1]);
    
    // Calculate scale change
    if (lastTouchDistance.value > 0) {
      const scaleChange = currentDistance / lastTouchDistance.value;
      const newScale = Math.max(1, Math.min(5, scale.value * scaleChange));
      scale.value = newScale;
    }
    
    // Calculate translation for panning (only if zoomed)
    if (scale.value > 1) {
      const deltaX = currentCenter.x - lastTouchCenter.value.x;
      const deltaY = currentCenter.y - lastTouchCenter.value.y;
      translateX.value += deltaX;
      translateY.value += deltaY;
    }
    
    lastTouchDistance.value = currentDistance;
    lastTouchCenter.value = currentCenter;
  } else if (event.touches.length === 1 && scale.value > 1) {
    // Single finger pan when zoomed
    event.preventDefault();
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - lastTouchCenter.value.x;
    const deltaY = touch.clientY - lastTouchCenter.value.y;
    
    translateX.value += deltaX;
    translateY.value += deltaY;
    
    lastTouchCenter.value = { x: touch.clientX, y: touch.clientY };
  }
};

// Handle touch end
const handleTouchEnd = (event: TouchEvent) => {
  if (event.touches.length < 2) {
    isPinching.value = false;
    
    // Only reset if user zooms out below minimum scale
    if (scale.value < 1) {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    }
  }
  
  if (event.touches.length === 1) {
    // Update last touch center for single finger panning
    lastTouchCenter.value = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
};

// Reset zoom and pan when closing or changing image
const resetTransform = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
  isPinching.value = false;
  lastTouchDistance.value = 0;
};

// Reset loading state when modal opens with new image
watch(
  () => props.imageUrl,
  () => {
    if (props.isOpen) {
      isImageLoading.value = true;
      resetTransform();
    }
  }
);

// Prevent body scroll when modal is open
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      isImageLoading.value = true;
      resetTransform();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      resetTransform();
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
  overflow: hidden;
  position: relative;
  touch-action: none; /* Disable default touch behaviors like scrolling and pinch-zoom on the container */
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
  user-select: none; /* Prevent text/image selection */
  -webkit-user-select: none;
  touch-action: none; /* Allow custom touch handling */
  cursor: grab;
}

.fullscreen-image:active {
  cursor: grabbing;
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
