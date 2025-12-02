import express from 'express'
import { NotificationController } from './notification.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
const router = express.Router()

router.get(
  '/',
  auth(
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  NotificationController.getNotificationFromDB,
)
router.get(
  '/admin',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.adminNotificationFromDB,
)
router.patch(
  '/',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  NotificationController.readNotification,
)
router.patch(
  '/admin',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  NotificationController.adminReadNotification,
)

export const NotificationRoutes = router
