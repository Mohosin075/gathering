import { Request, Response } from 'express'
import Stripe from 'stripe'
import colors from 'colors'
import { StatusCodes } from 'http-status-codes'
import { logger } from '../shared/logger'
import config from '../config'
import { handleSubscriptionCreated } from './handleSubscriptionCreated'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'

const handleStripeWebhook = async (req: Request, res: Response) => {
  // Extract Stripe signature and webhook secret
  const signature = req.headers['stripe-signature'] as string
  const webhookSecret = config.stripe.webhookSecret as string

  let event: Stripe.Event | undefined

  // Verify the event signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      webhookSecret,
    )
  } catch (error) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Webhook signature verification failed. ${error}`,
    )
  }

  // Check if the event is valid
  if (!event) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid event received!')
  }

  // Extract event data and type
  const data = event.data.object as Stripe.Subscription | Stripe.Account
  const eventType = event.type

  // Handle the event based on its type
  //   console.log(colors.bgGreen.bold(`Event Type: ${eventType}`))
  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionCreated(data as Stripe.Subscription)
        break

      default:
        logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`))
    }
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error handling event: ${error}`,
    )
  }

  res.sendStatus(200)
}

export default handleStripeWebhook
