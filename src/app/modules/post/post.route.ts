import express from 'express'
import { PostController } from './post.controller'
import { PostValidations } from './post.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import { handleMediaUpload } from './handleMediaUpload'

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  PostController.getAllPosts,
)
router.get(
  '/my-post',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  PostController.getMyPosts,
)

router.get(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  PostController.getSinglePost,
)

router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  fileUploadHandler(),
  handleMediaUpload,
  validateRequest(PostValidations.create),
  PostController.createPost,
)

router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  fileUploadHandler(),
  handleMediaUpload,
  validateRequest(PostValidations.update),
  PostController.updatePost,
)

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  PostController.deletePost,
)

export const PostRoutes = router
