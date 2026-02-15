import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { ChatController } from './chatmessage.controller'
import validateRequest from '../../middleware/validateRequest'
import { ChatmessageValidations } from './chatmessage.validation'

const router = express.Router()

// Chat routes (Protected - requires authentication)
router.post(
  '/:roomId/messages',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  validateRequest(ChatmessageValidations.sendMessage),
  ChatController.sendMessage,
)

router.get(
  '/:roomId/messages',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  validateRequest(ChatmessageValidations.getMessages),
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
  '/:roomId/participants',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.getChatParticipants,
)

export const ChatmessageRoutes = router
