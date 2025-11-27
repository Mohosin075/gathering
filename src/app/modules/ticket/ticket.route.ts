import express from 'express';
import { TicketController } from './ticket.controller';
import { TicketValidations } from './ticket.validation';
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
  TicketController.getAllTickets
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TicketController.getSingleTicket
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(TicketValidations.createTicketZodSchema),
  TicketController.createTicket
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(TicketValidations.updateTicketZodSchema),
  TicketController.updateTicket
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TicketController.deleteTicket
);

export const TicketRoutes = router;