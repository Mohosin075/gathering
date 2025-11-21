import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import { SubscriptionService } from './subscription.service'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import { createCheckoutSession } from '../../../stripe/checkOutSession'

export const createSession = catchAsync(async (req: Request, res: Response) => {
  const { planId } = req.params
  const session = await createCheckoutSession(req.user as JwtPayload, planId)

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Checkout Session Created Successfully',
    data: session,
  })
})

const subscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.subscriptionsFromDB(req.query)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription List Retrieved Successfully',
    data: result,
  })
})

const subscriptionDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.subscriptionDetailsFromDB(
    req.user as JwtPayload,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription Details Retrieved Successfully',
    data: result,
  })
})

export const SubscriptionController = {
  subscriptions,
  subscriptionDetails,
}
