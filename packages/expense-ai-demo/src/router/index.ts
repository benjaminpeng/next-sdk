import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/expenses/new-ai'
    },
    {
      path: '/expenses',
      name: 'ExpenseList',
      component: () => import('../views/expense-list/index.vue')
    },
    {
      path: '/expenses/new-ai',
      name: 'ExpenseNewAI',
      component: () => import('../views/expense-new/index.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/expenses/new-ai'
    }
  ]
})

export default router
