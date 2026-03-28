import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false } // 这个页面不需要登录
    },
    {
      path: '/app',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }, // 只有登录了才能进主页
      redirect: '/app/learn',
      children: [
        {
          path: 'learn', // 注意子路由开头不要加斜杠
          name: 'learn',
          component: () => import('../views/LearnView.vue')
        },
        {
          path: 'notebook',
          name: 'notebook',
          component: () => import('@/views/NotebookView.vue')
        },
        {
          path: 'history',
          name: 'history',
          component: () => import('../views/HistoryView.vue')
        },
        {
          path: 'ppt',
          name: 'ppt',
          component: () => import('../views/PPTView.vue')
        },
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  // 如果去的页面需要登录，但本地没有 token
  if (to.meta.requiresAuth && !userStore.token) {
    next({ name: 'login' }) // 强行踢回登录页
  } else {
    next() // 放行
  }
})

export default router