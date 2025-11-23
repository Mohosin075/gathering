// routes/share.routes.ts
import express from 'express'
import auth from '../../middleware/auth'
import validateRequest from '../../middleware/validateRequest'
import { ShareValidations } from './share.validation'
import { ShareController } from './share.controller'

const router = express.Router()

router.post(
  '/',
  auth(),
  validateRequest(ShareValidations.create),
  ShareController.sharePost,
)

router.get('/:postId', ShareController.getSharedPosts)

export const ShareRoutes = router
