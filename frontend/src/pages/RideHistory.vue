<template>
  <div class="q-ma-xl">
    <h6>TODO: populate this list from the backend's ride history. Since rides don't work, we need to hardcode selecting particular users to</h6>
    <q-select v-if="users" :options="users" v-model="selectedUser" label="Select a user to chat with"/>
    <q-btn v-if="selectedUser" label="Open Chat Session" @click="openChatSession()"/>
  </div>
</template>
<script>
import { useAuthStore } from 'src/stores/auth'
import { useEphemeralStore } from 'src/stores/ephemeral'
import axios from 'axios'

export default {
  name: 'Ride-history-page',
  setup() {
    const authStore = useAuthStore()
    const ephemeralStore = useEphemeralStore()
    return {
      authStore,
      ephemeralStore,
    }
  },
  async mounted() {
    //TODO Strapi backend from `.env`
    //TODO instead of all users, just grab those from ride history
    const resp = await axios.get('http://localhost:1337/api/users', {
      headers: {
        Authorization: `Bearer ${this.authStore.authToken}`
      }
    })
    this.users = resp.data
      .filter(o => o.username !== this.authStore.user.username)
      .map(o => ({
        label: o.username,
        value: o
      }))      
    console.log('users options: ', this.users)
  },
  data() {
    return {
      users: null,
      selectedUser: null
    }
  },
  methods: {
    openChatSession() {
      console.log('ephemeralStore: ', this.ephemeralStore)
      this.ephemeralStore.setUserToChatWith(this.selectedUser.value)
      this.$router.push('/chat')
    }
  }
}
</script>