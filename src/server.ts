import colors from 'colors'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import app from './app'
import config from './config'

const isServerless = !!process.env.VERCEL
import { socketHelper } from './helpers/socketHelper'
import { UserServices } from './app/modules/user/user.service'
// import { redisClient } from './helpers/redis'
// import { createAdapter } from "@socket.io/redis-adapter";
// import { emailWorker, notificationWorker } from './helpers/bull-mq-worker'
//uncaught exception
process.on('uncaughtException', error => {
  console.error('UnhandledException Detected', error)
  process.exit(1)
})

export const onlineUsers = new Map()
let server: any

let isDbConnected = false
async function connectDb() {
  if (!isDbConnected) {
    await mongoose.connect(config.database_url as string)
    isDbConnected = true
    console.log(colors.green('🚀 Database connected successfully'))
  }
}

async function main() {
  try {
    await connectDb()

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port)

    server = app.listen(port, () => {
      console.log(colors.yellow(`♻️  Application listening on port:${config.port}`))
    })

    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: '*',
      },
    })

    await UserServices.createAdmin()

    console.log(colors.green('🍁 Redis connected successfully'))

    socketHelper.socket(io)
    //@ts-ignore
    global.io = io
  } catch (error) {
    console.error(colors.red('🤢 Failed to connect Database'))
    config.node_env === 'development' && console.log(error)
  }

  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        console.error('UnhandledRejection Detected', error)
        process.exit(1)
      })
    } else {
      process.exit(1)
    }
  })
}

if (!isServerless) {
  main()
}

//SIGTERM
process.on('SIGTERM', async () => {
  console.log('SIGTERM IS RECEIVE')
  if (server) {
    server.close()
  }
})

export default async (req: any, res: any) => {
  await connectDb()
  return (app as any)(req, res)
}
