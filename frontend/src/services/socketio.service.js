/* 
  based off of:
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs-2
*/
import { io } from 'socket.io-client'
import { notifyHandler } from 'src/misc/helpers'
import { useMsgStore } from 'src/stores/msg'
import { useAuthStore } from 'src/stores/auth'
import { useEphemeralStore } from 'src/stores/ephemeral'
import * as c from 'src/misc/constants'

class SocketioService {
  socket
  msgStore = useMsgStore()
  authStore = useAuthStore()
  ephemeralStore = useEphemeralStore()
  constructor() { }

  setupSocketConnection(token, user) {
    console.log('setting up socket connection with token: ', token)
    this.socket = io(c.websocketServerBaseUrl, {
      auth: {
        token: token,
        user: user
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  socketIsOpen() {
    console.log('checking if socket is open and returning: ', !!this.socket)
    try {
      return this.socket.connected
    } catch {
      return false
    }
  }

  subscribeToMessages(cb) {
    if (!this.socket) return(true)
    this.socket.on('message', msg => {
      console.log('message received: ', msg)
      notifyHandler('info', `New Message from ${msg.name}`)
      this.msgStore.addMessage(msg)
      return cb(null, msg)
    })
  }
    
  sendMessage({message, roomName}, cb) {
    console.log('socket sending msg: ', message)
    console.log('socket? ', !!this.socket)
    if (this.socket) this.socket.emit('message', { message, roomName }, cb)
  }

  subscribeToRideRequest(cb) {
    if (!this.socket) return(true)
    this.socket.on('rideRequest', request => {
      console.log('received ride request: ', request)
      notifyHandler('info', `New ride request from ${request.user.username}`)
      this.ephemeralStore.addRideRequest(request)
      return cb(null, request)
    })
  }

  requestRide({route}) {
    console.log('socketio service requestRide()', this.socket)
    if (this.socket) this.socket.emit('orderRide', { route, user: this.authStore.user })
  }
}

export default new SocketioService()