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
    //these callback functions need access to `this` context
    //https://stackoverflow.com/a/31307223
    var self = this

    //TODO derive this host from environment variables
    const host = 'node-red-gdmxk-2022-09-05.au-syd.mybluemix.net'
    
    const wsSendUriSend = `wss://${host}/ws/chat`
    this.wsSend = new WebSocket(wsSendUriSend) 

    this.wsSend.onopen = function (ev) {
      self.connectStatus = '[Connected]'
      console.info('Connected to websocket with URI: ', wsSendUriSend)
    }

    this.wsSend.onclose = function (ev) {
      self.connectStatus = '[Disconnected]'
      console.info('Disconnected to websocket with URI: ', wsSendUriSend)
    }    

    this.wsSend.onmessage = function (ev) {
      console.log('ev: ', ev)
      console.log('wsSend onmessage triggered')
      const payload = JSON.parse(ev.data)
      console.log('payload: ', payload)
      self.messageId++
      self.messages.push({ user: payload.user, message: payload.message, timeSent: payload.ts, id: self.messageId })
    }   
  },
  data() {
    return {
      wsSend: null,
      wsReceive: null,
      connectStatus: null,
      //need a key in the `v-for` loop
      messageId: 0,
      messages: [],
      msg: '',
      // sendTo: null,
    }
  },
  methods: {
    sendMsg() {
      const session = (() => {
        console.log('latest message: ', this.messages[this.messages.length - 1])
        if (
          this.messages.length > 0 &&
          Object.keys(this.messages[this.messages.length - 1]).includes('session')
        ) {
          return this.messages[this.messages.length - 1].session
        }

        return null
      })()
      console.log('using session: ', session)

      const payload = {
        message: this.msg,
        user: this.authStore.user.username,
        // sendTo: this.sendTo,
        ts: (new Date()),
        session: session,
      }

      this.wsSend.send(JSON.stringify(payload))
      this.msg = ''
    }
  }
}
</script>
<!-- 

  [{"id":"4de189a4e2fdb82c","type":"tab","label":"Test Chat","disabled":false,"info":"","env":[]},{"id":"66c300675ea6c922","type":"websocket in","z":"4de189a4e2fdb82c","name":"","server":"bc740d23.438bf","client":"","x":290,"y":200,"wires":[["a0d8819af7b9f357","c72655c55022c060"]]},{"id":"a0d8819af7b9f357","type":"function","z":"4de189a4e2fdb82c","name":"","func":"let newMsg = {}\nconst parsedPayload = JSON.parse(msg.payload)\n\nif (!parsedPayload.session) {\n    newMsg.payload = parsedPayload\n    newMsg.payload.session = msg._session\n    newMsg.payload = JSON.stringify(newMsg.payload)\n} else {\n    msg._session = parsedPayload.session\n}\n\nreturn newMsg","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":460,"y":200,"wires":[["7dd503ab7dc44571","4c58ebfbbe2104ad"]]},{"id":"7dd503ab7dc44571","type":"websocket out","z":"4de189a4e2fdb82c","name":"","server":"bc740d23.438bf","x":645,"y":200,"wires":[]},{"id":"c72655c55022c060","type":"debug","z":"4de189a4e2fdb82c","name":"before function","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":480,"y":300,"wires":[]},{"id":"4c58ebfbbe2104ad","type":"debug","z":"4de189a4e2fdb82c","name":"after function","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":710,"y":320,"wires":[]},{"id":"bc740d23.438bf","type":"websocket-listener","path":"/ws/chat","wholemsg":"false"}]

 -->