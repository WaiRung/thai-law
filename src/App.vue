<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <h1 class="app-title">บัตรคำไทย กฎหมายไทย</h1>
      <p class="app-subtitle">Thai Law Flashcards</p>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-text">
          <span class="progress-label">ความคืบหน้า</span>
          <span class="progress-count">{{ currentIndex + 1 }} / {{ totalCards }}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="completed-text">
          ทำไปแล้ว {{ completedCards.size }} จากทั้งหมด {{ totalCards }} ใบ
        </div>
      </div>

      <!-- Flashcard -->
      <div class="flashcard-wrapper">
        <FlashCard 
          :card="currentCard" 
          :isFlipped="isFlipped"
          @flip="toggleFlip"
        />
      </div>

      <!-- Controls -->
      <div class="controls">
        <button 
          @click="previousCard" 
          :disabled="currentIndex === 0"
          class="control-btn control-prev"
          aria-label="Previous card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-icon">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="btn-text">ก่อนหน้า</span>
        </button>

        <button 
          @click="shuffleCards" 
          class="control-btn control-shuffle"
          aria-label="Shuffle cards"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-icon">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="btn-text">สุ่ม</span>
        </button>

        <button 
          @click="nextCard" 
          :disabled="currentIndex === totalCards - 1"
          class="control-btn control-next"
          aria-label="Next card"
        >
          <span class="btn-text">ถัดไป</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-icon">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Reset Button -->
      <div class="reset-section">
        <button @click="resetProgress" class="reset-btn">
          รีเซ็ตความคืบหน้า
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p>เรียนรู้กฎหมายไทยผ่านบัตรคำ</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FlashCard from './components/FlashCard.vue';
import { flashcards } from './data/cards';
import type { Flashcard } from './types/flashcard';

// State
const cards = ref<Flashcard[]>([...flashcards]);
const currentIndex = ref(0);
const isFlipped = ref(false);
const completedCards = ref(new Set<number>());

// Computed
const currentCard = computed(() => cards.value[currentIndex.value]);
const totalCards = computed(() => cards.value.length);
const progressPercentage = computed(() => ((currentIndex.value + 1) / totalCards.value) * 100);

// Methods
const toggleFlip = () => {
  isFlipped.value = !isFlipped.value;
  if (isFlipped.value) {
    completedCards.value.add(currentCard.value.id);
  }
};

const nextCard = () => {
  if (currentIndex.value < totalCards.value - 1) {
    currentIndex.value++;
    isFlipped.value = false;
  }
};

const previousCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    isFlipped.value = false;
  }
};

const shuffleCards = () => {
  const shuffled = [...cards.value];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  cards.value = shuffled;
  currentIndex.value = 0;
  isFlipped.value = false;
};

const resetProgress = () => {
  completedCards.value.clear();
  currentIndex.value = 0;
  isFlipped.value = false;
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
}

.app-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 1.5rem 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
  margin-bottom: 0.5rem;
}

.app-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
}

.main-content {
  flex: 1;
  padding: 1.5rem 1rem;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.progress-label {
  font-weight: 600;
}

.progress-count {
  font-weight: 700;
  color: #3b82f6;
}

.progress-bar {
  width: 100%;
  height: 0.75rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  transition: width 0.3s ease;
}

.completed-text {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

.flashcard-wrapper {
  flex: 1;
  min-height: 400px;
  max-height: 500px;
  margin-bottom: 1.5rem;
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.control-shuffle {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.control-shuffle:hover {
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-text {
  font-size: 0.875rem;
}

.reset-section {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.reset-btn {
  padding: 0.625rem 1.25rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.reset-btn:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.reset-btn:active {
  transform: translateY(0);
}

.app-footer {
  background-color: #1f2937;
  color: #9ca3af;
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
}

.app-footer p {
  margin: 0;
}

@media (max-width: 640px) {
  .app-header {
    padding: 1rem 0.75rem;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .app-subtitle {
    font-size: 0.875rem;
  }

  .main-content {
    padding: 1rem 0.75rem;
  }

  .flashcard-wrapper {
    min-height: 350px;
    max-height: 450px;
  }

  .controls {
    gap: 0.5rem;
  }

  .control-btn {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }

  .btn-text {
    display: none;
  }

  .btn-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .control-shuffle .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

@media (min-width: 641px) {
  .control-prev .btn-icon,
  .control-next .btn-icon {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
