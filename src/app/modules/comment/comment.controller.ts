// controllers/comment.controller.ts
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import { JwtPayload } from 'jsonwebtoken'
import { CommentServices } from './comment.service'
import sendResponse from '../../../shared/sendResponse'

const createComment = catchAsync(async (req: Request, res: Response) => {
  const commentData = req.body
  const userId = (req.user as JwtPayload)?.authId

  const result = await CommentServices.createComment(userId, commentData)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Comment created successfully',
    data: result,
  })
})

const getComments = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params
  const { page = 1, limit = 10 } = req.query

  const result = await CommentServices.getComments(
    postId,
    Number(page),
    Number(limit),
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Comments retrieved successfully',
    data: result,
  })
})

const getReplies = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params

  const result = await CommentServices.getReplies(commentId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Replies retrieved successfully',
    data: result,
  })
})

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const updateData = req.body
  const userId = (req.user as JwtPayload)?.authId

  const result = await CommentServices.updateComment(id, userId, updateData)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Comment updated successfully',
    data: result,
  })
})

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = (req.user as JwtPayload)?.authId

  const result = await CommentServices.deleteComment(id, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Comment deleted successfully',
    data: result,
  })
})

export const CommentController = {
  createComment,
  getComments,
  getReplies,
  updateComment,
  deleteComment,
}
