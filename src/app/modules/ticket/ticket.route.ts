import express from 'express'
import { TicketController } from './ticket.controller'
import { TicketValidations } from './ticket.validation'
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
  TicketController.getAllTickets,
)

router.get(
  '/my-tickets',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  TicketController.getMyTickets,
)

router.get(
  '/event/:eventId',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  TicketController.getMyTicketForEvent,
)

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  TicketController.getSingleTicket,
)

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  validateRequest(TicketValidations.create),
  TicketController.createTicket,
)

router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
  validateRequest(TicketValidations.update),
  TicketController.updateTicket,
)

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  TicketController.deleteTicket,
)

router.post(
  '/check-in',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  validateRequest(TicketValidations.checkIn),
  TicketController.checkInTicket,
)

export const TicketRoutes = router
