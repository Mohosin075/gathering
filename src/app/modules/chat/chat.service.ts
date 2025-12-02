import { Message } from '../message/message.model'
import { IChat } from './chat.interface'
import { Chat } from './chat.model'

const createChatToDB = async (payload: any): Promise<IChat> => {
  const isExistChat: IChat | null = await Chat.findOne({
    participants: { $all: payload },
  })

  if (isExistChat) {
    return isExistChat
  }
  const chat: IChat = await Chat.create({ participants: payload })
  return chat
}

const getChatFromDB = async (user: any, search: string): Promise<IChat[]> => {
  const chats: any = await Chat.find({ participants: { $in: [user.authId] } })
    .populate({
      path: 'participants',
      select: '_id name image profession updatedAt',
      match: {
        _id: { $ne: user.authId },
        ...(search && { name: { $regex: search, $options: 'i' } }),
      },
    })
    .select('participants status updatedAt')
    .sort({ updatedAt: -1 }) // Sort chats by latest update
    .lean()

  // Filter out chats where no participants match
  const filteredChats = chats?.filter(
    (chat: any) => chat?.participants?.length > 0,
  )

  // Get last message for each chat
  const chatsWithLastMessage = await Promise.all(
    filteredChats.map(async (chat: any) => {
      const lastMessage = await Message.findOne(
        { chatId: chat._id },
        { text: 1, image: 1 },
      )
        .sort({ createdAt: -1 })
        .limit(1)
        .populate('sender', 'name image') // Populate sender info if needed
        .lean()

      return {
        ...chat,
        lastMessage: lastMessage || null,
      }
    }),
  )

  return chatsWithLastMessage
}

export const ChatService = { createChatToDB, getChatFromDB }
