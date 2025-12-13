import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { User } from '../user/user.model'
import { ChatMessage } from './chatmessage.model'

export class WebSocketService {
  private io: Server

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    this.setupSocketEvents()
  }

  private setupSocketEvents() {
    this.io.on('connection', socket => {
      console.log('New client connected:', socket.id)

      // Join stream room
      socket.on('join-stream', async (streamId: string, userId: string) => {
        socket.join(`stream-${streamId}`)

        // Send welcome message
        this.io.to(`stream-${streamId}`).emit('user-joined', {
          userId,
          timestamp: new Date(),
        })
      })

      // Send chat message
      socket.on(
        'send-message',
        async (data: { streamId: string; userId: string; message: string }) => {
          try {
            // Get user profile
            const user = await User.findById(data.userId)
            if (!user) return

            // Save to database
            const chatMessage = await ChatMessage.create({
              streamId: data.streamId,
              userId: data.userId,
              userProfile: {
                name: user.name,
                avatar: user.profile,
              },
              message: data.message,
              messageType: 'text',
            })

            // Broadcast to stream room
            const messagePayload = {
              id: chatMessage._id.toString(),
              userId: chatMessage.userId.toString(),
              userProfile: chatMessage.userProfile,
              message: chatMessage.message,
              formattedTime: chatMessage.formattedTime,
              likes: 0,
              hasLiked: false,
              createdAt: chatMessage.createdAt,
            }

            this.io
              .to(`stream-${data.streamId}`)
              .emit('new-message', messagePayload)
          } catch (error) {
            socket.emit('error', { message: 'Failed to send message' })
          }
        },
      )

      // Like message
      socket.on('like-message', async (messageId: string, userId: string) => {
        const message = await ChatMessage.findById(messageId)
        if (message) {
          // Update like logic...
          this.io.emit('message-liked', { messageId, userId })
        }
      })

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  // Emit stream status updates
  public emitStreamUpdate(streamId: string, data: any) {
    this.io.to(`stream-${streamId}`).emit('stream-update', data)
  }

  // Emit viewer count updates
  public emitViewerCount(streamId: string, count: number) {
    this.io.to(`stream-${streamId}`).emit('viewer-count', { count })
  }
}
