// controllers/share.controller.ts
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import { JwtPayload } from 'jsonwebtoken'
import { ShareServices } from './share.service'
import sendResponse from '../../../shared/sendResponse'

const sharePost = catchAsync(async (req: Request, res: Response) => {
  const { postId, caption } = req.body
  const userId = (req.user as JwtPayload)?.authId

  const result = await ShareServices.sharePost(userId, postId, caption)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Post shared successfully',
    data: result,
  })
})

const getSharedPosts = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params
  const { page = 1, limit = 10 } = req.query

  const result = await ShareServices.getSharedPosts(
    postId,
    Number(page),
    Number(limit),
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Shared posts retrieved successfully',
    data: result,
  })
})

export const ShareController = {
  sharePost,
  getSharedPosts,
}
