import { createRouter, createWebHistory } from 'vue-router';
import Landing from '../views/Landing.vue';
import KidDashboard from '../views/KidDashboard.vue';
import ParentDashboard from '../views/ParentDashboard.vue';
import DeductionsSettings from '../views/DeductionsSettings.vue';
import { useAuth } from '../composables/useAuth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: Landing,
    },
    {
      path: '/kid',
      name: 'kid',
      component: KidDashboard,
    },
    {
      path: '/parent',
      name: 'parent',
      component: ParentDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/deductions-settings',
      name: 'deductions-settings',
      component: DeductionsSettings,
      meta: { requiresAuth: true },
    },
  ],
});

// 路由守卫：检查家长页面是否需要认证
router.beforeEach((to: any, from: any, next: any) => {
  if (to.meta.requiresAuth) {
    const { checkAuth } = useAuth();
    if (!checkAuth()) {
      // 未认证，重定向到首页并要求输入密码
      next({ name: 'landing', query: { redirect: to.fullPath, requireAuth: 'true' } });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;

