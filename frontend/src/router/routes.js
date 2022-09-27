
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/login', component: () => import('pages/Login.vue') },
      { path: '/register', component: () => import('pages/Register.vue') },
      {
        path: '/profile', component: () => import('pages/Profile.vue'), meta: {
          requiresLoggedIn: true
        }
      },
      //TODO don't allow navigation to here if already driver
      {
        path: '/driver-signup', component: () => import('pages/DriverSignup.vue'), meta: {
          requiresLoggedIn: true
        }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
