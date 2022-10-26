import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '../stores/auth'
import { notifyHandler } from 'src/misc/helpers'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(
    async (to, from) => {
      const authStore = useAuthStore()

      //check for auth requirements of route
      const isRequiresAuth = to.matched.some(
        (r) => r.meta.requiresLoggedIn,
      )
      if (!isRequiresAuth) {
        return true
      }
      const isLoggedIn = !!authStore.user
      console.log('isLoggedIn? ', isLoggedIn)
      if (!isLoggedIn) {
        notifyHandler('negative', `Login required to access path '${to.fullPath}'`)
        Router.push('/login')
      }

      //check for driver requirements of route
      const isRequiresDriver = to.matched.some(
        (r) => r.meta.requiresDriver,
      )
      if(!isRequiresDriver) {
        return true
      }
      const isDriver = !!(authStore.user && authStore.user.driverProfile)
      console.log('isDriver? ', isDriver)
      if(!isDriver) {
        notifyHandler('negative', `You must be a driver to access path '${to.fullPath}'`)
        Router.push(from.path)
      }

      //catch-all return
      return true
    }
  )

  return Router
})
