/* 
  based off of:
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs
  https://deepinder.me/creating-a-real-time-chat-app-with-vue-socket-io-and-nodejs-2
*/

const c = require('./constants')
const { v4: uuidv4 } = require('uuid')
const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http, {
  cors: {
    //TODO from `.env`
    origins: ['http://localhost:8080']
  }
})
const axios = require('axios')

app.get('/', (req, res) => {
  res.send('<h1>Hey Socket.io</h1>')
})

io.on('connection', (socket) => {
  // join user's own room
  socket.join(socket.handshake.auth.user.id)
  console.log('a user connected with username: ', socket.handshake.auth.user.username)

  socket.on('disconnect', () => {
    console.log('user disconnected')
    //TODO use socket.leave(roomName) to close connections
  })

  //TODO is this being used?
  socket.on('join', (roomName) => {
    console.log('join: ' + roomName)
    socket.join(roomName)
  })

  socket.on('message', ({ message, roomName }, callback) => {
    console.log('sending message to: ', roomName)
    // generate data to send to receivers
    const outgoingMessage = {
      message,
      id: socket.handshake.auth.user.id,
      name: socket.handshake.auth.user.username,      
    }
    // send socket to all in room except sender
    socket.to(roomName).emit('message', outgoingMessage)
    callback({
      status: 'ok'
    })
  })

  socket.on('orderRide', ({ route, user, roomName }) => {
    console.log('server got a request with route: ', route, '\nfrom user: ', user, '\n with a socket id of ', roomName)
    socket.broadcast.emit('rideRequest', {route, user, roomName})
  })

  socket.on('acceptRide', ({roomName, user, route}, callback) =>{
    console.log('server recieved ride acceptance with User object: ', user)

    //ride has started, generate trip ID
    const tripId = uuidv4()
    console.log('tripId: ', tripId)

    const outgoingMessage = {
      name: user.username,
      route: route,
      tripId: tripId    //copy for the passenger
    }
    socket.to(roomName.id).emit('acceptRide', outgoingMessage)
    callback({
      status: 'ok',
      tripId: tripId    //copy for the driver
    })
  })
})

//use Strapi to verify token - this method is a bit of a workaround, as it should be
//possible to expose the underlying `jwt.verify()` function, but getting the user should
//be enough for now
io.use(async (socket, next) => {
  let token = socket.handshake.auth.token

  try {
    //if token is not valid, axios call with throw error for us to catch
    //TODO Strapi API from `.env`
    await axios.get(`${c.coreApiBaseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return next()
  } catch (err) {
    console.error('User failed authentication with error: ', err.response.data.error)
    return next(new Error(err.response.data.error))
  }
})

http.listen(3000, () => {
  console.log('listening on *:3000')
})