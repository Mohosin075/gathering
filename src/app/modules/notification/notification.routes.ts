import express from 'express'
import { NotificationController } from './notification.controller'
import { USER_ROLES } from '../../../enum/user'
import auth from '../../middleware/auth'
const router = express.Router()

// Existing routes
router.get(
  '/',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
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
router.get(
  '/history',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.getNotificationsHistory,
)

// Broadcast notification
router.post(
  '/broadcast',
  auth(
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  NotificationController.createNotification,
)

// NEW ROUTES - Add these
router.post(
  '/track-open',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  NotificationController.trackNotificationOpen,
)

router.post(
  '/track-engagement',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  NotificationController.trackNotificationEngagement,
)

export const NotificationRoutes = router
