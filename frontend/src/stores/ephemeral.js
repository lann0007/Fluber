import { defineStore } from 'pinia'

//use to store random data that doesn't need long-term persistance
export const useEphemeralStore = defineStore('ephemeral', {
  state: () => ({
    userToChatWith: null,
    rideRequests: [],
  }),

  getters: {
    getUserToChatWith (state) {
      return state.userToChatWith
    },
    getRideRequests (state) {
      return state.rideRequests
    }
  },

  actions: {
    setUserToChatWith (user) {
      this.userToChatWith = user
    },
    addRideRequest(rideRequest) {
      this.rideRequests.push(rideRequest)
    },
    clearRideRequests() {
      this.rideRequests = []
    }
  }
})