
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import RegisterView from '../views/RegisterView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
  path: '/register',
  name: 'register',
  component: RegisterView,
  meta: { requiresGuest: true },
},
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem('accessToken');

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' };
  }

  if (to.meta.requiresGuest && token) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
