import { defineStore } from 'pinia'

//use to store random data that doesn't need long-term persistance
export const useLocationStore = defineStore('loc', {
  state: () => ({
    location: null,
  }),
  persist: true,
  getters: {
    getLocation () {
      return state.location
    }
  },

  actions: {
    setLocation(newLocation) {
      this.location = newLocation
    },
    clearLocation(){
      this.location = null
    }
  }
})