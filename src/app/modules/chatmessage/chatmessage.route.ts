import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { ChatController } from './chatmessage.controller'

const router = express.Router()

// Chat routes (Protected - requires authentication)
router.post(
  '/:streamId/messages',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.sendMessage,
)

router.get(
  '/:streamId/messages',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.getChatMessages,
)

router.post(
  '/messages/:messageId/like',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.likeMessage,
)

router.delete(
  '/messages/:messageId',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.deleteMessage,
)

router.get(
  '/:streamId/participants',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.getChatParticipants,
)

export const ChatmessageRoutes = router
