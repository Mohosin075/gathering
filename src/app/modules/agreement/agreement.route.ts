import express from 'express'
import { AgreementController } from './agreement.controller'
import { AgreementValidations } from './agreement.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.STAFF),
  AgreementController.getAllAgreements,
)

router.get(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.STAFF),
  AgreementController.getSingleAgreement,
)

router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.STAFF),

  validateRequest(AgreementValidations.create),
  AgreementController.createAgreement,
)

router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AgreementController.getAllAgreements,
)

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AgreementController.deleteAgreement,
)

export const AgreementRoutes = router
