import express from 'express'
import { BookingController } from './booking.controller'
import { BookingValidations } from './booking.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

// Base route: /bookings
router
  .route('/')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.CLIENT,
      USER_ROLES.STAFF,
    ),
    BookingController.getAllBookings,
  )
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLIENT),
    validateRequest(BookingValidations.create),
    BookingController.createBooking,
  )

// My services route: /bookings/my-services
router.get(
  '/my-services',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.CLIENT,
    USER_ROLES.STAFF,
  ),
  BookingController.myServices,
)

// Single booking routes: /bookings/:id
router
  .route('/:id')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.CLIENT,
      USER_ROLES.STAFF,
    ),
    BookingController.getSingleBooking,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BookingController.updateBooking,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BookingController.deleteBooking,
  )

export const BookingRoutes = router
