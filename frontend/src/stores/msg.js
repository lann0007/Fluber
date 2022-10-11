import { defineStore } from 'pinia'

export const useMsgStore = defineStore('msg', {
  state: () => ({
    //TODO populate with message history from backend
    messages: []
  }),
  persist: true,

  getters: {
    getMessages (state) {
      return state.messages
    }
  },

  actions: {
    addMessage (msg) {
      this.messages.push(msg)
    }
  }
})
