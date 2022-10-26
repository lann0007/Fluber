import { defineStore } from 'pinia'

//use to store random data that doesn't need long-term persistance
export const useLocationStore = defineStore('loc', {
  state: () => ({
    location: null,
    driverLocation: null,
  }),
  persist: true,
  getters: {
    getLocation () {
      return state.location
    },
    getDriverLocation() {
      return state.driverLocation
    }
  },

  actions: {
    setLocation(newLocation) {
      this.location = newLocation
    },
    clearLocation(){
      this.location = null
    },
    setDriverLocation(location) {
      this.driverLocation = location
    }
  }
})