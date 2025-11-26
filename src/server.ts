import colors from 'colors'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import app from './app'
import config from './config'

import { socketHelper } from './helpers/socketHelper'
import { UserServices } from './app/modules/user/user.service'

// Uncaught exceptions
process.on('uncaughtException', error => {
  console.error('🔥 UncaughtException Detected:', error)
  process.exit(1)
})

export const onlineUsers = new Map()
let server: any

async function main() {
  try {
    await mongoose.connect(config.database_url as string)
    console.log(colors.green('🚀 Database connected successfully'))

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port)

    server = app.listen(port, config.ip_address as string, () => {
      console.log(
        colors.yellow(`♻️ Application listening on port: ${config.port}`),
      )
    })

    // Socket.IO setup
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: { origin: '*' },
    })

    // Create admin user
    await UserServices.createAdmin()

    // Socket helper
    socketHelper.socket(io)
    //@ts-ignore
    global.io = io

    console.log(colors.green('🍁 Socket.IO initialized successfully'))
  } catch (error) {
    console.error(
      colors.red('🤢 Failed to start the server or connect to DB'),
      error,
    )
  }

  // Handle unhandled promise rejections
  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        console.error('🔥 UnhandledRejection Detected:', error)
        process.exit(1)
      })
    } else {
      console.error('🔥 UnhandledRejection Detected:', error)
      process.exit(1)
    }
  })
}

// Start main
main()

// Graceful shutdown on SIGTERM
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down server...')
  if (server) {
    server.close()
  }
})
