import express from 'express'
import { AttendeeController } from './attendee.controller'
import { AttendeeValidations } from './attendee.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  validateRequest(AttendeeValidations.filter),
  AttendeeController.getAllAttendees,
)

router.get(
  '/my-attendees',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  AttendeeController.getMyAttendees,
)

router.get(
  '/event/:eventId',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  AttendeeController.getEventAttendees,
)

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  AttendeeController.getSingleAttendee,
)

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  validateRequest(AttendeeValidations.create),
  AttendeeController.createAttendee,
)

router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  validateRequest(AttendeeValidations.update),
  AttendeeController.updateAttendee,
)

router.post(
  '/check-in',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  validateRequest(AttendeeValidations.checkIn),
  AttendeeController.checkInAttendee,
)

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  AttendeeController.deleteAttendee,
)

export const AttendeeRoutes = router
