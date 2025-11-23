<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <div class="modal-content">
            <h2 class="modal-title">{{ sectionId }}</h2>
            <div class="modal-body">
              <ul class="descriptions-list">
                <li
                  v-for="(desc, index) in descriptions"
                  :key="index"
                  class="description-item"
                >
                  {{ desc.content }}
                </li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="close-button" @click="handleClose">ปิด</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from "vue";
import type { DescriptionContent } from "../types/description";

interface Props {
  isOpen: boolean;
  sectionId: string;
  descriptions: DescriptionContent[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const handleClose = () => {
  emit("close");
};

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.isOpen) {
    handleClose();
  }
};

// Prevent body scroll when modal is open
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
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
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #14b8a6;
  margin: 0;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.descriptions-list {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0;
}

.description-item {
  font-size: 1rem;
  line-height: 1.8;
  color: #1f2937;
  margin-bottom: 1rem;
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.description-item:last-child {
  margin-bottom: 0;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
  display: flex;
  justify-content: center;
}

.close-button {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.close-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.4);
}

.close-button:active {
  transform: translateY(0);
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

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-container {
    max-height: 90vh;
  }

  .modal-content {
    max-height: 90vh;
  }

  .modal-title {
    font-size: 1.25rem;
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .descriptions-list {
    padding-left: 1.25rem;
  }

  .description-item {
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }

  .modal-footer {
    padding: 1rem;
  }

  .close-button {
    padding: 0.625rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>
