// routes/like.routes.ts
import express from 'express'
import auth from '../../middleware/auth'
import validateRequest from '../../middleware/validateRequest'
import { LikeValidations } from './like.validation'
import { LikeController } from './like.controller'

const router = express.Router()

router.post(
  '/toggle',
  auth(),
  validateRequest(LikeValidations.toggle),
  LikeController.toggleLike,
)

router.get(
  '/:targetType/:targetId',
  validateRequest(LikeValidations.getLikes),
  LikeController.getLikes,
)

router.get(
  '/status/:targetType/:targetId',
  auth(),
  validateRequest(LikeValidations.checkStatus),
  LikeController.checkLikeStatus,
)

export const LikeRoutes = router
