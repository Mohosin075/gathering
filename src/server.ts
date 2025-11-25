import colors from 'colors'
import mongoose from 'mongoose'
import app from './app'
import config from './config'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Check if running on Vercel serverless
const isServerless = !!process.env.VERCEL

// --- Database Connection ---
let isDbConnected = false
async function connectDb() {
  if (!isDbConnected) {
    await mongoose.connect(config.database_url as string)
    isDbConnected = true
    console.log(colors.green('🚀 Database connected successfully'))
  }
}

// --- Main function for local server ---
let server: any
async function main() {
  try {
    await connectDb()

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port)

    server = app.listen(port, () => {
      console.log(colors.yellow(`♻️  Server running on port: ${config.port}`))
    })
  } catch (error) {
    console.error(colors.red('🤢 Failed to connect Database'))
    if (config.node_env === 'development') console.log(error)
  }

  // Handle unhandled promises
  process.on('unhandledRejection', error => {
    console.error('UnhandledRejection Detected', error)
    if (server) server.close(() => process.exit(1))
    else process.exit(1)
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    console.error('UnhandledException Detected', error)
    process.exit(1)
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received')
    if (server) server.close()
  })
}

// --- Run main only if not serverless ---
if (!isServerless) main()

// --- Export handler for Vercel serverless ---
export default async (req: any, res: any) => {
  await connectDb()
  return app(req, res)
}
