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
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(ChatmessageValidations.sendMessage),
  ChatController.sendMessage,
)

router.get(
  '/:roomId/messages',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(ChatmessageValidations.getMessages),
  ChatController.getChatMessages,
)

router.post(
  '/messages/:messageId/like',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ChatController.likeMessage,
)

router.delete(
  '/messages/:messageId',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ChatController.deleteMessage,
)

router.get(
  '/:roomId/participants',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ChatController.getChatParticipants,
)

export const ChatmessageRoutes = router
