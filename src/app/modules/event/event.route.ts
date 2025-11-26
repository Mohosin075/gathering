import express from 'express';
import { EventController } from './event.controller';
import { EventValidations } from './event.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';


const router = express.Router();

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  EventController.getAllEvents
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  EventController.getSingleEvent
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(EventValidations.create),
  EventController.createEvent
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(EventValidations.update),
  EventController.updateEvent
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  EventController.deleteEvent
);

export const EventRoutes = router;