import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { AttendanceController } from './attendance.controller'

const router = express.Router()

router.post(
  '/:eventId/rsvp',
  auth(USER_ROLES.USER, USER_ROLES.ORGANIZER),
  AttendanceController.handleRsvp,
)

router.post(
  '/:eventId/check-in',
  auth(USER_ROLES.USER, USER_ROLES.ORGANIZER),
  AttendanceController.handleCheckIn,
)

router.get(
  '/:eventId',
  auth(USER_ROLES.USER, USER_ROLES.ORGANIZER, USER_ROLES.ADMIN),
  AttendanceController.getAttendanceStats,
)

export const AttendanceRoutes = router
