import express from 'express'
import { PlanController } from './plan.controller'
import { createPlanZodValidationSchema } from './plan.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
const router = express.Router()

router
  .route('/')
  .post(
    auth(USER_ROLES.ADMIN),
    validateRequest(createPlanZodValidationSchema),
    PlanController.createPlan,
  )
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.STAFF),
    PlanController.getPlan,
  )

router
  .route('/:id')
  .patch(auth(USER_ROLES.ADMIN), PlanController.updatePlan)
  .delete(auth(USER_ROLES.ADMIN), PlanController.deletePlan)

export const PlanRoutes = router
