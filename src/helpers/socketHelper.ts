import { Server } from 'socket.io'

const socket = (io: Server) => {
  io.on('connection', socket => {
    console.log('✅ A user connected:', socket.id)

    // Join user to their personal room for individual notifications
    socket.on('joinUserRoom', (userId: string) => {
      socket.join(`user:${userId}`)
      console.log(`🏠 User ${userId} joined room: user:${userId}`)
    })

    // Add direct event listeners for Postman
    socket.on('broadcastNotification', data => {
      console.log(`📡 Client ${socket.id} subscribed to broadcastNotification`)
    })

    socket.on('getNotification', data => {
      console.log(`📡 Client ${socket.id} subscribed to getNotification`)
    })

    // Log all events received from client
    socket.onAny((eventName, ...args) => {
      console.log(`📨 FROM CLIENT - Event: ${eventName}`, args)
    })

    socket.on('disconnect', reason => {
      console.log('❌ A user disconnected:', socket.id, 'Reason:', reason)
    })
  })

  // Add debugging for all emitted events
  const originalEmit = io.emit
  io.emit = function (event: string, ...args: any[]) {
    console.log(`🚀 EMITTING to ALL - Event: ${event}`, args[0])
    return originalEmit.call(this, event, ...args)
  }

  // Debug room emissions
  const originalTo = io.to
  io.to = function (room: string) {
    console.log(`🎯 Targeting room: ${room}`)
    const result = originalTo.call(this, room)

    // Override emit for this specific room
    const originalRoomEmit = result.emit
    result.emit = function (event: string, ...args: any[]) {
      console.log(`📤 EMITTING to ROOM ${room} - Event: ${event}`, args[0])
      return originalRoomEmit.call(this, event, ...args)
    }

    return result
  }
}

export const socketHelper = { socket }

// Helper function to send notifications via socket
export const sendSocketNotification = (io: Server, notification: any) => {
  console.log('🎯 sendSocketNotification called with:', {
    title: notification.title,
    targetAudience: notification.targetAudience,
    receiver: notification.receiver,
  })

  if (notification.receiver) {
    // Send to specific user
    console.log(`📤 Sending to user:${notification.receiver}`)
    io.to(`user:${notification.receiver}`).emit('getNotification', notification)
  } else if (notification.targetAudience === 'ALL_USERS') {
    // Broadcast to all connected users
    console.log('🌐 Broadcasting to ALL users')
    io.emit('broadcastNotification', notification)
  } else {
    console.log('⚠️ No valid receiver or target audience')
  }
}
