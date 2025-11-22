import express from 'express'
import { UserController } from './user.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { S3Helper } from '../../../helpers/image/s3helper'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import { createStaffSchema, updateUserSchema } from './user.validation'

const router = express.Router()

router.get(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  UserController.getProfile,
)

router.patch(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),

  fileUploadHandler(),

  async (req, res, next) => {
    const payload = req.body
    try {
      const imageFiles = (req.files as any)?.image as Express.Multer.File[]

      if (imageFiles) {
        // Take the first image only
        const imageFile = imageFiles[0]

        // Upload single image to S3
        const uploadedImageUrl = await S3Helper.uploadToS3(imageFile, 'image')

        if (!uploadedImageUrl) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to upload image',
          )
        }

        // Merge into req.body for Zod validation
        req.body = {
          profile: uploadedImageUrl,
          ...payload,
        }
      }
      next()
    } catch (error) {
      console.error({ error })
      res.status(400).json({ message: 'Failed to upload image' })
    }
  },

  validateRequest(updateUserSchema),
  UserController.updateProfile,
)

router.delete(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  UserController.deleteProfile,
)

router
  .route('/')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getAllUsers,
  )

router
  .route('/:userId')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getUserById,
  )
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.deleteUser,
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(updateUserSchema),
    UserController.updateUserStatus,
  )

export const UserRoutes = router
