import { StatusCodes } from 'http-status-codes'
import config from '../config'
import { IPlan } from '../app/modules/plan/plan.interface'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'

export const createStripeProductCatalog = async (
  payload: Partial<IPlan>,
): Promise<{ productId: string; priceId: string } | null> => {
  // Create Product in Stripe
  const product = await stripe.products.create({
    name: payload.title as string,
    description: payload.description as string,
  })

  let interval: 'month' | 'year' = 'month'
  let intervalCount = 1

  // Map duration to interval_count
  switch (payload.duration) {
    case '1 month':
      interval = 'month'
      intervalCount = 1
      break
    case '3 months':
      interval = 'month'
      intervalCount = 3
      break
    case '6 months':
      interval = 'month'
      intervalCount = 6
      break
    case '1 year':
      interval = 'year'
      intervalCount = 1
      break
    default:
      interval = 'month'
      intervalCount = 1 // Defaults to 1 month if duration is not specified
  }

  // Create Price for the Product
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Number(payload.price) * 100, // in cents
    currency: 'usd', // or your chosen currency
    recurring: { interval, interval_count: intervalCount },
  })

  if (!price) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create price in Stripe',
    )
  }

  // Create a Payment Link
  // const paymentLink = await stripe.paymentLinks.create({
  //   line_items: [
  //     {
  //       price: price.id,
  //       quantity: 1,
  //     },
  //   ],
  //   after_completion: {
  //     type: 'redirect',
  //     redirect: {
  //       url: `${config.stripe.paymentSuccess}`, // Redirect URL on successful payment
  //     },
  //   },
    
  //   metadata: {
  //     productId: product.id,
  //   },
  // })

  // if (!paymentLink.url) {
  //   throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create payment link')
  // }

  return { productId: product.id, priceId: price.id }
}
