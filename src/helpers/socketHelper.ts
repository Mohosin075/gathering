import { Server } from 'socket.io'

const socket = (io: Server) => {
  io.on('connection', socket => {
    console.log('A user connected')

    socket.on('disconnect', () => {
      console.log('A user disconnected')
    })
  })
}

export const socketHelper = { socket }
