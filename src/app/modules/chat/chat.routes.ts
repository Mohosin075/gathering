import express from 'express'
import { ChatController } from './chat.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
const router = express.Router()

router.post(
  '/:id',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.createChat,
)
router.get(
  '/',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  ChatController.getChat,
)

export const ChatRoutes = router
