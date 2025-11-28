import { IChat } from './chat.interface';
import { Chat } from './chat.model';

const createChatToDB = async (payload: any): Promise<IChat> => {
  const isExistChat: IChat | null = await Chat.findOne({
    participants: { $all: payload },
  });

  if (isExistChat) {
    return isExistChat;
  }
  const chat: IChat = await Chat.create({ participants: payload });
  return chat;
};

const getChatFromDB = async (user: any, search: string): Promise<IChat[]> => {

  const chats: any = await Chat.find({ participants: { $in: [user.authId] } })
    .populate({
      path: 'participants',
      select: '_id firstName lastName image profession',
      match: {
        _id: { $ne: user.authId }, // Exclude user.id in the populated participants
        ...(search && { firstName: { $regex: search, $options: 'i' } }), // Apply $regex only if search is valid
      }
    })
    .select('participants status createdAt');

  // Filter out chats where no participants match the search (empty participants)
  const filteredChats = chats?.filter(
    (chat: any) => chat?.participants?.length > 0
  );

  return filteredChats;
};

export const ChatService = { createChatToDB, getChatFromDB };