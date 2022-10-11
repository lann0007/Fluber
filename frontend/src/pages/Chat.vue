<!-- 
  based off of:
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs-2
-->
<template>
  <div class="q-ma-xl">
    <h6>Chat with {{ this.ephemeralStore.getUserToChatWith.username }}</h6>
    <div v-for="msg of msgStore.messages" :key="msg">
      <!-- {{msg}} -->
      <!-- check the `id` (i.e., user's ID) for how to display message -->
      <p style="font-size: 2em; margin:0" :class="[msg.id === authStore.user.id ? 'sentMsg' : 'receivedMsg']">
        {{ msg.message }}
      </p>
      <div style="margin-bottom:10px" :class="[msg.id === authStore.user.id ? 'sentMsg' : 'receivedMsg']">
        {{ msg.name }}
      </div>
    </div>
    <q-input placeholder="Message" v-model="msg" />
    <q-btn label="Send" @click="sendMsg()" />
  </div>
</template>

<script>
import SocketioService from '../services/socketio.service.js'
import { useAuthStore } from 'src/stores/auth'
import { useEphemeralStore } from 'src/stores/ephemeral'
import { useMsgStore } from 'src/stores/msg'

export default {
  name: 'Chat-page',
  setup() {
    const authStore = useAuthStore()
    const ephemeralStore = useEphemeralStore()
    const msgStore = useMsgStore()
    return {
      authStore,
      ephemeralStore,
      msgStore,
    }
  },
  created() {
    if(this.ephemeralStore.getUserToChatWith === null) {
      this.$router.push('/ride-history')
    } else {
      console.log('opening chat session with: ', this.ephemeralStore.getUserToChatWith.username)
      //TODO also open socket elsewhere, so that we can chat without being at this page
      if(!SocketioService.socketIsOpen()) {
        SocketioService.setupSocketConnection(this.authStore.authToken, this.authStore.user)
        SocketioService.subscribeToMessages((err, data) => {
          // this.messages.push(data)
          this.msgStore.addMessage({
            message,
            id: this.authStore.user.id,
            name: this.authStore.user.username
          })
        })
      }
    }    
  },
  beforeUnmount() {
    SocketioService.disconnect()
  },
  data() {
    return {
      msg: '',
      // messages: []
    }
  },
  methods: {
    sendMsg() {
      //the room to use is the user ID of the person we're trying to message
      const receiver = this.ephemeralStore.getUserToChatWith.id      
      console.log('sending msg: ', this.msg)
      console.log('receiver: ', receiver)
      const message = this.msg
      SocketioService.sendMessage({message, roomName: receiver}, cb => {
        console.log(cb)
        // this.messages.push({
        //   message,
        //   id: this.authStore.user.id,
        //   name: this.authStore.user.username
        // })
        this.msgStore.addMessage({
          message,
          id: this.authStore.user.id,
          name: this.authStore.user.username
        })
        //clear input
        this.msg = ''
      })
    }
  }
}
</script>
<style>
  .sentMsg {
    text-align: right;
  }
  .receivedMsg {
    text-align: left;
  }
</style>