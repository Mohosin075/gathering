import stripe from '../config/stripe'
import { User } from '../app/modules/user/user.model'
import { Plan } from '../app/modules/plan/plan.model'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import ApiError from '../errors/ApiError'
import config from '../config'

export const createCheckoutSession = async (
  userdata: JwtPayload,
  planId: string,
) => {
  const { authId: userId } = userdata

  const user = await User.findById(userId)
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')

  const plan = await Plan.findById(planId)
  if (!plan) throw new ApiError(StatusCodes.NOT_FOUND, 'Plan not found!')

  if (!plan.priceId)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Plan missing Stripe Price ID')
  if (!user.email)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User missing email')

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', // ✅ ensure your Stripe types are correct
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId.toString(), // ensure primitive string
        quantity: 1,
      },
    ],
    customer_email: user.email.toString(), // primitive string
    // success_url: `${config.stripe.paymentSuccess}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    // cancel_url: `${config.stripe.paymentSuccess}/payments/cancel`,
    success_url: `${config.stripe.paymentSuccess}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.paymentSuccess}/payments/cancel`,
    metadata: {
      planId: plan._id.toString(),
      userId: user._id.toString(),
    },
  })

  if (!session.url)
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create Stripe session',
    )

  return session.url
}
