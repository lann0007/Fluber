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
import { useLocationStore } from 'src/stores/loc'
import { useRideStateStore } from 'src/stores/rideState'

class SocketioService {
  socket
  msgStore = useMsgStore()
  authStore = useAuthStore()
  ephemeralStore = useEphemeralStore()
  locStore = useLocationStore()
  rideStateStore = useRideStateStore()
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
      notifyHandler('info', `New Message from ${msg.name}`, null, true)
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
      notifyHandler('info', `New ride request from ${request.user.username}`, null, true)
      this.ephemeralStore.addRideRequest(request)
      return cb(null, request)
    })
  }

  requestRide({route}) {
    const isLoggedIn = !!this.authStore.user
    if (!isLoggedIn) throw new Error('You must be logged in to order a ride')
    console.log('socketio service requestRide()', this.socket.id)
    if (this.socket) this.socket.emit('orderRide', { route, user: this.authStore.user, roomName: this.socket.id })
  }

  joinRoom({roomName, user, route, driverInitialLocation}, cb){
    console.log('trying to connect to the room: ',route,'\n of the sender: ', user)
    console.log('results from running socketIsOpen() ', this.socketIsOpen())
    if (this.socket) this.socket.emit('acceptRide', {roomName, user, route, driverInitialLocation}, cb)
  }
  subscribeToJoinRoom(cb) {
    if (this.socket) {
      this.socket.on('acceptRide', message => {
        console.log('message: ', message)
        notifyHandler('info', `ride request has been accepted by ${message.name}`)
        this.locStore.setLocation(message.route)
        this.locStore.setDriverLocation(message.driverInitialLocation)
        //persist the trip ID
        this.rideStateStore.setTripId(message.tripId)
        console.log('FROM THE DRIVER', message.route)
        console.log('set trip ID: ', this.rideStateStore.getTripIp())
        return cb(null, message)
      })
    }       
  }

  beginRide({passengerId, driverId, route}, cb) {
    console.log('beingRide passengerId: ', passengerId, '. driverId: ', driverId, '. route: ', route)
    if(this.socket) {
      this.socket.emit('beginRide', {passengerId, driverId, route}, cb)
    }
  }

  subscribeToRideHasBegun(cb) {
    if (this.socket) {
      this.socket.on('rideHasBegun', message => {
        console.log('rideHasBegun message: ', message)
        notifyHandler('info', 'Ride has begun')
        return cb(null, message)
      })      
    }
  }

  endRide({passengerId, driverId, route, tripId}, cb) {
    console.log('endRide passengerId: ', passengerId, '. driverId: ', driverId, '. route: ', route, '. tripId: ', tripId)
    if (this.socket) {
      this.socket.emit('endRide', {passengerId, driverId, route, tripId}, cb)
    }
  }

  subscribeToRideHasEnded(cb) {
    if (this.socket) {
      this.socket.on('rideHasEnded', message => {
        console.log('rideHasEnded message: ', message)
        notifyHandler('info', 'Ride has ended')
        return cb(null, message)
      })
    }
  }
}

export default new SocketioService()