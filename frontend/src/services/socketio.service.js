/* 
  based off of:
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs-2
*/
import { io } from 'socket.io-client'
import { notifyHandler } from 'src/misc/helpers'
import { useMsgStore } from 'src/stores/msg'

class SocketioService {
  socket
  msgStore = useMsgStore()
  constructor() { }

  setupSocketConnection(token, user) {
    console.log('setting up socket connection with token: ', token)
    //TODO grab from `.env` instead
    this.socket = io('http://localhost:3000', {
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
    return !!this.socket
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
}

export default new SocketioService()