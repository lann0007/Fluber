import { defineStore } from 'pinia'

//use to store random data that doesn't need long-term persistance
export const useEphemeralStore = defineStore('ephemeral', {
  state: () => ({
    userToChatWith: null
  }),

  getters: {
    getUserToChatWith (state) {
      return state.userToChatWith
    }
  },

  actions: {
    setUserToChatWith (user) {
      this.userToChatWith = user
    }
  }
})
