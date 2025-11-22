// routes/comment.routes.ts
import express from 'express'
import auth from '../../middleware/auth'
import validateRequest from '../../middleware/validateRequest'
import { CommentValidations } from './comment.validation'
import { CommentController } from './comment.controller'

const router = express.Router()

router.post(
  '/',
  auth(),
  validateRequest(CommentValidations.create),
  CommentController.createComment,
)

router.get(
  '/post/:postId',
  validateRequest(CommentValidations.getComments),
  CommentController.getComments,
)

router.get(
  '/replies/:commentId',
  validateRequest(CommentValidations.getReplies),
  CommentController.getReplies,
)

router.put(
  '/:id',
  auth(),
  validateRequest(CommentValidations.update),
  CommentController.updateComment,
)

router.delete(
  '/:id',
  auth(),
  validateRequest(CommentValidations.delete),
  CommentController.deleteComment,
)

export const CommentRoutes = router
