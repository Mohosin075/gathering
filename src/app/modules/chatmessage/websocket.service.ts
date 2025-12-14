/* eslint-disable @typescript-eslint/no-explicit-any */
import { IChatMessageResponseDTO } from './chatmessage.interface'

const getIO = () => (global as any).io

const broadcastMessage = (streamId: string, message: IChatMessageResponseDTO) => {
  const io = getIO()
  if (io) {
    io.to(`stream:${streamId}`).emit('new-message', message)
  }
}

const broadcastLike = (streamId: string, messageId: string, userId: string) => {
  const io = getIO()
  if (io) {
    io.to(`stream:${streamId}`).emit('message-liked', {
      messageId,
      userId,
    })
  }
}

const broadcastDelete = (streamId: string, messageId: string) => {
  const io = getIO()
  if (io) {
    io.to(`stream:${streamId}`).emit('message-deleted', {
      messageId,
    })
  }
}

export const ChatSocketHelper = {
  broadcastMessage,
  broadcastLike,
  broadcastDelete,
}

