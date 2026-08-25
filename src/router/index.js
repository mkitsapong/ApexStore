import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    // Public routes
    { path: '/', name: 'home', component: () => import('../pages/HomePage.vue') },
    { path: '/shop', name: 'shop', component: () => import('../pages/ShopPage.vue') },
    { path: '/shop/:id', name: 'product', component: () => import('../pages/ProductPage.vue') },
    { path: '/auth/login', name: 'login', component: () => import('../pages/auth/LoginPage.vue'), meta: { guestOnly: true } },
    { path: '/auth/register', name: 'register', component: () => import('../pages/auth/RegisterPage.vue'), meta: { guestOnly: true } },

    // Member routes
    { path: '/dashboard', name: 'dashboard', component: () => import('../pages/member/DashboardPage.vue'), meta: { requiresAuth: true } },
    { path: '/wallet', name: 'wallet', component: () => import('../pages/member/WalletPage.vue'), meta: { requiresAuth: true } },
    { path: '/topup', name: 'topup', component: () => import('../pages/member/TopupPage.vue'), meta: { requiresAuth: true } },
    { path: '/orders', name: 'orders', component: () => import('../pages/member/OrdersPage.vue'), meta: { requiresAuth: true } },
    { path: '/orders/:id', name: 'order-detail', component: () => import('../pages/member/OrderDetailPage.vue'), meta: { requiresAuth: true } },
    { path: '/profile', name: 'profile', component: () => import('../pages/member/ProfilePage.vue'), meta: { requiresAuth: true } },

    // Admin routes
    { path: '/admin', name: 'admin', component: () => import('../pages/admin/AdminDashboard.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/products', name: 'admin-products', component: () => import('../pages/admin/AdminProducts.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/orders', name: 'admin-orders', component: () => import('../pages/admin/AdminOrders.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/topups', name: 'admin-topups', component: () => import('../pages/admin/AdminTopups.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/users', name: 'admin-users', component: () => import('../pages/admin/AdminUsers.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/tickets', name: 'admin-tickets', component: () => import('../pages/admin/AdminTickets.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/settings', name: 'admin-settings', component: () => import('../pages/admin/AdminSettings.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

    // 404
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../pages/NotFoundPage.vue') }
  ]
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return next({ name: 'dashboard' })
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return next({ name: 'dashboard' })
  }
  next()
})

export default router
