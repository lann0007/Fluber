<!-- main logic comes from the second flow in: https://developer.ibm.com/tutorials/cl-rtchat-app/ -->
<!-- TODO maintain the chat history (probably save in Strapi and populate `messages` using the `mounted()` vue lifecycle hook) -->
<template>
  <div class="q-ma-xl">
    <p>Connection Status: {{ connectStatus }}</p>
    <p v-for="m of messages" :key="m.id">{{m}}</p>
    <q-input placeholder="Message" v-model="msg" />
    <q-btn label="Send" @click="sendMsg()" />
  </div>
</template>
<script>
import { useAuthStore } from 'src/stores/auth'

export default {
  name: 'Chat-page',
  setup() {
    const authStore = useAuthStore()
    return {
      authStore
    }
  },
  created() {
    //https://www.youtube.com/watch?v=4via-J98jwM
    console.log('Starting websocket connection')
    //TODO derive this host from environment variables
    const host = 'node-red-gdmxk-2022-09-05.au-syd.mybluemix.net'
    const wsUri = `wss://${host}/ws/chat`
    this.ws = new WebSocket(wsUri)

    //these callback functions need access to `this` context
    //https://stackoverflow.com/a/31307223
    var self = this

    this.ws.onopen = function (ev) {
      self.connectStatus = '[Connected]'
      console.info('Connected to websocket with URI: ', wsUri)
    }

    this.ws.onclose = function (ev) {
      self.connectStatus = '[Disconnected]'
      console.info('Disconnected to websocket with URI: ', wsUri)
    }    

    this.ws.onmessage = function (ev) {
      const payload = JSON.parse(ev.data)
      self.messageId++
      self.messages.push({ user: payload.user, message: payload.message, timeSent: payload.ts, id: self.messageId })
    }
  },
  data() {
    return {
      ws: null,
      connectStatus: null,
      //need a key in the `v-for` loop
      messageId: 0,
      messages: [],
      msg: ''
    }
  },
  methods: {
    sendMsg() {
      const payload = {
        message: this.msg,
        user: this.authStore.user.username,
        ts: (new Date())
      }

      this.ws.send(JSON.stringify(payload))
      this.msg = ''
    }
  }
}
</script>