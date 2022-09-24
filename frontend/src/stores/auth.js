import { defineStore } from 'pinia'
import axios from 'axios'
import * as c from 'src/misc/constants'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authToken: null,
    user: null
  }),
  persist: true,
  actions: {
    async doLogin(username, password) {
      const resp = await axios
        .post(`${c.coreApiBaseUrl}/api/auth/local`, {
          identifier: username,
          password: password
        })
        .catch((err) => {
          console.error(err.response)
          notifyHandler('negative', 'Failed to login', err.response.statusText)
          return false
        })

      //assume login request to API was successful
      this.authToken = resp.data.jwt
      this.user = resp.data.user
      return true
    },
    doLogout() {
      this.authToken = null
      this.user = null
    },
    setAuthToken(authToken) {
      this.authToken = authToken
    },
    setUser(user) {
      this.user = user
    }
  },
})