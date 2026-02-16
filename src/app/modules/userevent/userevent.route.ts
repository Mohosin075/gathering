import express from 'express';
import { UsereventController } from './userevent.controller';
import { UsereventValidations } from './userevent.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody';


const router = express.Router();

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  UsereventController.getAllUserevents
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  UsereventController.getSingleUserevent
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(UsereventValidations.create),
  UsereventController.createUserevent
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(UsereventValidations.update),
  UsereventController.updateUserevent
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  UsereventController.deleteUserevent
);

export const UsereventRoutes = router;