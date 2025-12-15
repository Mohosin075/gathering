import express from 'express'
import { EventController } from './event.controller'
import { EventValidations, nearbySchema } from './event.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

const router = express.Router()

router.get(
  '/',
  // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  EventController.getAllEvents,
)
router.get(
  '/my-events',
  auth(USER_ROLES.ORGANIZER),
  EventController.getMyEvents,
)

router.get(
  '/nearby',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  // validateRequest(nearbySchema),
  EventController.getNearbyEvents,
)

router.get(
  '/:id',
  // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  EventController.getSingleEvent,
)

router.post(
  '/',
  auth(USER_ROLES.ORGANIZER),

  fileAndBodyProcessorUsingDiskStorage(),

  validateRequest(EventValidations.create),
  EventController.createEvent,
)

router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),

  fileAndBodyProcessorUsingDiskStorage(),

  validateRequest(EventValidations.update),
  EventController.updateEvent,
)

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  EventController.deleteEvent,
)

export const EventRoutes = router
