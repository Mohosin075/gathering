import colors from 'colors'
import { Server } from 'socket.io'

const socket = (io: Server) => {
  io.on('connection', socket => {
    console.log(colors.blue('A user connected'))
    //disconnect
    socket.on('disconnect', () => {
      console.log(colors.red('A user disconnect'))
    })
  })
}

export const socketHelper = { socket }
