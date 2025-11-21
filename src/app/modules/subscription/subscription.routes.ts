import express from 'express'
import {
  createSession,
  SubscriptionController,
} from './subscription.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
const router = express.Router()

router.post(
  '/create-checkout-session/:planId',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT),
  createSession,
)

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT),
  SubscriptionController.subscriptions,
)

router.get(
  '/my-plan',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT),
  SubscriptionController.subscriptionDetails,
)

export const SubscriptionRoutes = router
