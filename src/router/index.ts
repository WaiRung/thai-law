import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainMenuView from '../views/MainMenuView.vue'
import CategoryView from '../views/CategoryView.vue'
import FlashcardView from '../views/FlashcardView.vue'
import SectionsListView from '../views/SectionsListView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'main-menu',
    component: MainMenuView,
  },
  {
    path: '/flashcards',
    name: 'flashcard-categories',
    component: CategoryView,
  },
  {
    path: '/flashcards/:categoryId',
    name: 'flashcards',
    component: FlashcardView,
    props: true,
  },
  {
    path: '/sections',
    name: 'sections-list',
    component: SectionsListView,
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, _savedPosition) {
    // Always scroll to top on navigation
    return { top: 0 }
  },
})

// Navigation guard to prevent accidental exits
router.beforeEach((to) => {
  // If trying to navigate to undefined route, redirect to home
  if (to.matched.length === 0) {
    return '/'
  }
})

export default router
