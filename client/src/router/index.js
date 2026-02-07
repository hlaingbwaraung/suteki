import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue')
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('../views/ExplorePage.vue')
  },
  {
    path: '/categories/:slug',
    name: 'CategoryList',
    component: () => import('../views/CategoryListPage.vue')
  },
  {
    path: '/categories',
    name: 'Categories',
    redirect: '/explore'
  },
  {
    path: '/businesses/:id',
    name: 'BusinessDetail',
    component: () => import('../views/BusinessDetailPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterPage.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/UserDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/shop-owner',
    name: 'ShopOwnerDashboard',
    component: () => import('../views/ShopOwnerDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/FavoritesPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/settings',
    name: 'ProfileSettings',
    component: () => import('../views/ProfileSettings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about-japan',
    name: 'About',
    component: () => import('../views/AboutJapan.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/ContactPage.vue')
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: () => import('../views/FAQPage.vue')
  },
  {
    path: '/learn-japanese',
    name: 'LearnJapanese',
    component: () => import('../views/JLPTQuizPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/premium',
    name: 'Premium',
    component: () => import('../views/PremiumPage.vue')
  },
  {
    path: '/points-shop',
    name: 'PointsShop',
    component: () => import('../views/PointsShopPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
