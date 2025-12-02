import express from 'express'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { SavedEventController } from './savedEvent.controller'
import { SavedEventValidations } from './savedEvent.validation'

const router = express.Router()

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),
  SavedEventController.getAllSavedEvents,
)

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),
  SavedEventController.getSingleSavedEvent,
)

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),

  validateRequest(SavedEventValidations.create),
  SavedEventController.createSavedEvent,
)

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),

  validateRequest(SavedEventValidations.update),
  SavedEventController.updateSavedEvent,
)

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),
  SavedEventController.deleteSavedEvent,
)

export const SavedEventRoutes = router
