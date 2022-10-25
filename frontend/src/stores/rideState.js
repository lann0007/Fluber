import { defineStore } from 'pinia'

export const useRideStateStore = defineStore('rideState', {
  state: () => ({
    tripId: null
  }),
  persist: true,

  getters: {
    getTripIp(state) {
      return state.tripId
    }
  },

  actions: {
    setTripId(tripId) {
      this.tripId = tripId
    },
    clearTripId() {
      this.tripId = null
    }
  }
})
