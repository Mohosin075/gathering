// controllers/like.controller.ts
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import { LikeServices } from './like.service'
import sendResponse from '../../../shared/sendResponse'
import { JwtPayload } from 'jsonwebtoken'

const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const { targetId, targetType } = req.body
  const userId = (req.user as JwtPayload)?.authId

  const result = await LikeServices.toggleLike(userId, targetId, targetType)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.liked ? 'Liked successfully' : 'Unliked successfully',
    data: result,
  })
})

const getLikes = catchAsync(async (req: Request, res: Response) => {
  const { targetId, targetType } = req.params

  const result = await LikeServices.getLikes(
    targetId,
    targetType as 'post' | 'comment',
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Likes retrieved successfully',
    data: result,
  })
})

const checkLikeStatus = catchAsync(async (req: Request, res: Response) => {
  const { targetId, targetType } = req.params
  const userId = (req.user as JwtPayload)?.authId

  const result = await LikeServices.checkLikeStatus(
    userId,
    targetId,
    targetType as 'post' | 'comment',
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Like status retrieved successfully',
    data: result,
  })
})

export const LikeController = {
  toggleLike,
  getLikes,
  checkLikeStatus,
}
