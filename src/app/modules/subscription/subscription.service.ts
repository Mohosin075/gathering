import { JwtPayload } from 'jsonwebtoken'
import { ISubscription } from './subscription.interface'
import { Subscription } from './subscription.model'
import stripe from '../../../config/stripe'
import { User } from '../user/user.model'
import QueryBuilder from '../../builder/QueryBuilder'
import { IPlan } from '../plan/plan.interface'
import { createCheckoutSession } from '../../../stripe/checkOutSession'
// import checkUsage from './checkSubscription'

const subscriptionDetailsFromDB = async (
  user: JwtPayload,
): Promise<ISubscription | {}> => {
  const subscription = await Subscription.findOne({ user: user.authId })
    .populate<{ plan: IPlan }>('plan', 'title price duration type')
    .lean()

  console.log({ subscription })

  if (!subscription) {
    return {} // Return empty object if no subscription found
  }

  // 🧩 If it's a free plan, skip Stripe check
  const isFreePlan =
    subscription?.plan?.price === 0 || !subscription.subscriptionId

  if (isFreePlan) {
    return subscription
  }

  try {
    const subscriptionFromStripe = await stripe.subscriptions.retrieve(
      subscription.subscriptionId,
    )

    // Check subscription status and update database accordingly
    if (subscriptionFromStripe?.status !== 'active') {
      await Promise.all([
        User.findByIdAndUpdate(
          user.authId,
          { subscribe: false },
          { new: true },
        ),
        Subscription.findOneAndUpdate(
          { user: user.authId },
          { status: 'expired' },
          { new: true },
        ),
      ])
    }

    return subscription
  } catch (error: any) {
    console.error('Stripe subscription retrieval failed:', error.message)

    // If Stripe check fails, fallback to marking it as expired
    await Subscription.findOneAndUpdate(
      { user: user.authId },
      { status: 'expired' },
      { new: true },
    )

    return subscription
  }
}

const subscriptionsFromDB = async (
  query: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const result = new QueryBuilder(Subscription.find(), query).paginate()
  const subscriptions = await result.modelQuery
    .populate([
      {
        path: 'plan',
        select: 'title price duration',
      },
      {
        path: 'user',
        select: 'name email profile',
      },
    ])
    .select('-createdAt -updatedAt -__v -customerId -subscriptionId')
    .lean()
  const pagination = await result.getPaginationInfo()

  return { subscriptions, pagination }
}

export const SubscriptionService = {
  subscriptionDetailsFromDB,
  subscriptionsFromDB,
}
