import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import config from '../../../config'
import { User } from '../user/user.model'
import { ChatMessage } from './chatmessage.model'

interface UserSocket {
  userId: string
  streamId: string
  socketId: string
  name: string
}

class WebSocketServer {
  private io: Server
  private activeUsers: Map<string, UserSocket> = new Map()
  private streamRooms: Map<string, Set<string>> = new Map()

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: ['http://localhost:5002', 'http://10.10.7.11:5002'],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    })

    this.initializeSocket()
  }

  private initializeSocket() {
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token || socket.handshake.query?.token

        if (!token) {
          return next(new Error('Authentication error: No token provided'))
        }

        const decoded = jwt.verify(
          token as string,
          config.jwt.jwt_secret as string,
        ) as any
        socket.data.userId = decoded.userId || decoded.authId
        socket.data.user = decoded
        next()
      } catch (error) {
        console.error('Socket auth error:', error)
        next(new Error('Authentication error: Invalid token'))
      }
    })

    this.io.on('connection', socket => {
      console.log(
        `✅ Client connected: ${socket.id} - User: ${socket.data.userId}`,
      )

      // Join stream room
      socket.on('join-stream', async (streamId: string) => {
        try {
          if (!streamId) {
            socket.emit('error', { message: 'Stream ID is required' })
            return
          }

          console.log(`User ${socket.data.userId} joining stream ${streamId}`)

          // Clean up previous rooms
          const previousRooms = Array.from(socket.rooms).filter(
            room => room !== socket.id,
          )
          previousRooms.forEach(room => socket.leave(room))

          // Join new stream room
          socket.join(`stream:${streamId}`)
          socket.data.streamId = streamId

          // Get user info from database
          const user = await User.findById(socket.data.userId).select(
            'name profile',
          )

          // Store user info
          this.activeUsers.set(socket.id, {
            userId: socket.data.userId,
            streamId,
            socketId: socket.id,
            name: user?.name || 'Anonymous',
          })

          // Add to stream room set
          if (!this.streamRooms.has(streamId)) {
            this.streamRooms.set(streamId, new Set())
          }
          this.streamRooms.get(streamId)?.add(socket.data.userId)

          // Get current user count
          const userCount = this.getStreamUserCount(streamId)

          // Notify others in the stream
          socket.to(`stream:${streamId}`).emit('user-joined', {
            userId: socket.data.userId,
            userCount,
            userName: user?.name || 'Anonymous',
          })

          // Send welcome to user with current user count
          socket.emit('stream-joined', {
            streamId,
            userCount,
            message: 'Successfully joined stream chat',
          })

          // Send viewer count update to all
          this.io.to(`stream:${streamId}`).emit('viewer-count', {
            count: userCount,
          })

          console.log(
            `✅ User ${socket.data.userId} joined stream ${streamId}. Total viewers: ${userCount}`,
          )
        } catch (error) {
          console.error('Error joining stream:', error)
          socket.emit('error', { message: 'Failed to join stream' })
        }
      })

      // Handle chat messages
      socket.on(
        'send-message',
        async (data: { streamId: string; message: string }) => {
          try {
            const { streamId, message } = data

            console.log(`📨 Message received from ${socket.data.userId}:`, {
              streamId,
              message,
            })

            if (!streamId || !message?.trim()) {
              socket.emit('error', {
                message: 'Stream ID and message are required',
              })
              return
            }

            // Validate user is in the stream room
            if (!socket.rooms.has(`stream:${streamId}`)) {
              console.warn(
                `User ${socket.data.userId} not in stream room ${streamId}`,
              )
              socket.emit('error', {
                message: 'You must join the stream first',
              })
              return
            }

            // Get user info from database
            const user = await User.findById(socket.data.userId).select(
              'name profile',
            )
            if (!user) {
              socket.emit('error', { message: 'User not found' })
              return
            }

            // IMPORTANT: We are NOT saving to DB here - let HTTP API handle that
            // Create message object for WebSocket
            const messageData = {
              id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: socket.data.userId,
              userProfile: {
                name: user.name,
                avatar: user.profile,
              },
              message: message.trim(),
              formattedTime: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              likes: 0,
              hasLiked: false,
              createdAt: new Date(),
            }

            console.log(`📤 Broadcasting message to stream:${streamId}`)

            // Broadcast to ALL users in the stream room (including sender)
            this.io.to(`stream:${streamId}`).emit('new-message', messageData)

            console.log(
              `✅ Message broadcasted from ${socket.data.userId} in stream ${streamId}`,
            )
          } catch (error: any) {
            console.error('❌ Error handling message:', error)
            socket.emit('error', {
              message: 'Failed to send message',
              error: error.message,
            })
          }
        },
      )

      // Handle typing indicator
      socket.on('typing', (data: { streamId: string }) => {
        try {
          const { streamId } = data
          if (!streamId) return

          const userSocket = this.activeUsers.get(socket.id)
          if (!userSocket) return

          socket.to(`stream:${streamId}`).emit('user-typing', {
            userId: socket.data.userId,
            name: userSocket.name,
          })
        } catch (error) {
          console.error('Error handling typing:', error)
        }
      })

      // Handle message likes
      socket.on('like-message', async (data: { messageId: string }) => {
        try {
          const { messageId } = data

          const userSocket = this.activeUsers.get(socket.id)
          if (!userSocket) return

          // Update in database
          await ChatMessage.findByIdAndUpdate(messageId, {
            $inc: { likes: 1 },
            $addToSet: { likedBy: socket.data.userId },
          })

          // Broadcast to stream
          this.io.to(`stream:${userSocket.streamId}`).emit('message-liked', {
            messageId,
            userId: socket.data.userId,
            userName: userSocket.name,
          })
        } catch (error) {
          console.error('Error liking message:', error)
          socket.emit('error', { message: 'Failed to like message' })
        }
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`)

        const userSocket = this.activeUsers.get(socket.id)
        if (userSocket) {
          // Remove from active users
          this.activeUsers.delete(socket.id)

          // Remove from stream room
          const streamUsers = this.streamRooms.get(userSocket.streamId)
          if (streamUsers) {
            streamUsers.delete(userSocket.userId)
            if (streamUsers.size === 0) {
              this.streamRooms.delete(userSocket.streamId)
            } else {
              // Notify others
              this.io.to(`stream:${userSocket.streamId}`).emit('user-left', {
                userId: userSocket.userId,
                userCount: this.getStreamUserCount(userSocket.streamId),
                userName: userSocket.name,
              })

              // Update viewer count
              this.io.to(`stream:${userSocket.streamId}`).emit('viewer-count', {
                count: this.getStreamUserCount(userSocket.streamId),
              })
            }
          }
        }
      })

      // Handle errors
      socket.on('error', error => {
        console.error(`❌ Socket error for ${socket.id}:`, error)
      })

      // Ping/Pong for connection health
      socket.on('ping', callback => {
        if (typeof callback === 'function') {
          callback({ timestamp: Date.now() })
        }
      })

      // Request current viewer count
      socket.on('get-viewer-count', (streamId: string) => {
        if (streamId) {
          socket.emit('viewer-count', {
            count: this.getStreamUserCount(streamId),
          })
        }
      })
    })

    // Handle server errors
    this.io.engine.on('connection_error', err => {
      console.error('❌ Socket.io connection error:', err)
    })
  }

  private getStreamUserCount(streamId: string): number {
    return this.streamRooms.get(streamId)?.size || 0
  }

  // Public method to emit events to stream
  public emitToStream(streamId: string, event: string, data: any) {
    console.log(`📢 Emitting ${event} to stream:${streamId}`, data)
    this.io.to(`stream:${streamId}`).emit(event, data)
  }

  // Get active users for a stream
  public getActiveUsers(streamId: string): number {
    return this.getStreamUserCount(streamId)
  }
}

export default WebSocketServer
