import { defineStore } from 'pinia'
import axios from 'axios'
import * as c from 'src/misc/constants'
import { notifyHandler } from 'src/misc/helpers'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authToken: null,
    user: null
  }),
  persist: true,
  actions: {
    async doLogin(email, password) {
      //this is just for the JWT
      const res = await axios
        .post(`${c.coreApiBaseUrl}/api/auth/local`, {
          identifier: email,
          password: password
        })
        .catch((err) => {
          console.error(err.response)
          notifyHandler('negative', 'Failed to login', err.response.data.error.message)
        })
      if(!res) return false

      //assume login request to API was successful
      this.authToken = res.data.jwt

      //also try get the driver profile (can't `populate` on `auth/local`)
      const success = await this.getUserProfile()
        .catch((err) => {
          notifyHandler('negative', 'Failed to login. Could not retrieve the user profile', err.message)
          //if this request fails, the whole login flow was unsuccessful, so reset
          this.authToken = null
          console.error(err)
        })
      //`success` will be undefined if an error is caught, so cast to boolean
      return !!success
    },
    doLogout() {
      this.authToken = null
      this.user = null
    },
    //TODO also do call to `api/users/me` like in `doLogin()` (reuse the code)
    async doRegister(username, email, password) {
      const resp = await axios
        .post(`${c.coreApiBaseUrl}/api/auth/local/register`, {
          username: username,
          email: email,
          password: password
        })
        .catch((err) => {
          console.error(err.response)
          notifyHandler('negative', 'Failed to register', err.response.statusText)
          return false
        })

      //assume register request to API was successful
      this.authToken = resp.data.jwt
      this.user = resp.data.user
      return true
    },
    setAuthToken(authToken) {
      this.authToken = authToken
    },
    setUser(user) {
      this.user = user
    },
    /**
     * Gets the user profile while populating necessary relations
     * 
     * @returns {Boolean} if the request was successful
     */
    async getUserProfile() {
      const populateStr = 'populate[driverProfile][populate][0]=identification&populate[role][populate][0]=*&populate[profilePicture][populate][0]=*'
      const resp = await axios
        .get(`${c.coreApiBaseUrl}/api/users/me?${populateStr}`, {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          }
        })
        .catch((err) => {
          console.error(err.response)          
          throw new Error(err.response.data.error.message)
        })
      this.user = resp.data
      return true
    }
  },
})