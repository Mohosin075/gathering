import express from 'express'
import { MeetingController } from './meeting.controller'
import { MeetingValidation } from './meeting.validation'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
const router = express.Router()

router.post(
  '/create-meeting',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
  ),
  validateRequest(MeetingValidation.createMeetingZodSchema),
  MeetingController.createMeeting,
)

router.get(
  '/join/:meetingId',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
  ),
  MeetingController.joinMeeting,
)

router.get(
  '/my-meetings',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
  ),
  MeetingController.myMeetings,
)

router.patch(
  '/:meetingId/close',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
  ),
  MeetingController.closeMeeting,
)

router.delete(
  '/:meetingId',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ORGANIZER,
  ),
  MeetingController.deleteMeeting,
)

export const MeetingRoutes = router
