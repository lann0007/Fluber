<template>
  <div class="q-ma-xl">
    <q-select v-if="users" :options="users" v-model="selectedUser" label="Select a user to chat with"/>
    <q-btn v-if="selectedUser" label="Open Chat Session" @click="openChatSession()"/>
  </div>
</template>
<script>
import { useAuthStore } from 'src/stores/auth'
import { useEphemeralStore } from 'src/stores/ephemeral'
import axios from 'axios'
import * as c from 'src/misc/constants'
import _ from 'lodash'

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
    const resp = await axios.get(`${c.coreApiBaseUrl}/api/completed-trips?populate=*`, {
      headers: {
        Authorization: `Bearer ${this.authStore.authToken}`
      }
    })
    console.log('resp: ', resp)
    
    const dataWithDuplicates = resp.data.data
      .map(o => {
        const userDataToGrab = (() => {
          const isDriver = !!(this.authStore.user && this.authStore.user.driverProfile)
          if (isDriver) {
            return o.attributes.user_passenger
          }
          return o.attributes.user_driver
        })()
        console.log('userDataToGrab; ', userDataToGrab)
        return {
          label: userDataToGrab.data.attributes.username,
          value: userDataToGrab.data,
        }
      })

    //FIXME not the most efficient method for getting rid of duplicates from the list
    this.users = _.uniqBy(dataWithDuplicates, 'label')
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