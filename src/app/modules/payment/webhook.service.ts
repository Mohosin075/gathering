import { StatusCodes } from 'http-status-codes'
import config from '../../../config'
import stripe from '../../../config/stripe'
import ApiError from '../../../errors/ApiError'
import { Ticket } from '../ticket/ticket.model'
import { Payment } from './payment.model'
import { Event } from '../event/event.model'

const handleCheckoutSessionCompleted = async (
  sessionData: any,
): Promise<void> => {
  try {
    const sessionWithDetails = await stripe.checkout.sessions.retrieve(
      sessionData.id,
      {
        expand: ['payment_intent', 'line_items'],
      },
    )
    let lookupId: string

    if (typeof sessionWithDetails.payment_intent === 'string') {
      lookupId = sessionWithDetails.payment_intent
    } else if (sessionWithDetails.payment_intent?.id) {
      lookupId = sessionWithDetails.payment_intent.id
    } else {
      lookupId = sessionWithDetails.id
    }

    const mongoSession = await Payment.startSession()
    mongoSession.startTransaction()

    try {
      // Find and lock the payment document
      const payment = await Payment.findOne({
        $or: [
          { paymentIntentId: lookupId },
          { 'metadata.checkoutSessionId': sessionWithDetails.id },
        ],
      }).session(mongoSession)

      if (!payment) {
        throw new Error(
          `Payment not found for session: ${sessionWithDetails.id}`,
        )
      }

      // Check if already processed to avoid duplicates
      if (payment.status === 'succeeded') {
        await mongoSession.commitTransaction()
        return
      }

      // Update payment
      payment.status = 'succeeded'
      payment.metadata = { ...payment.metadata, ...sessionWithDetails }
      await payment.save({ session: mongoSession })

      // Update ticket
      await Ticket.findByIdAndUpdate(
        payment.ticketId,
        {
          status: 'confirmed',
          paymentStatus: 'paid',
        },
        { session: mongoSession },
      )

      // Update event tickets sold
      const ticket = await Ticket.findById(payment.ticketId).session(
        mongoSession,
      )
      if (ticket) {
        await Event.findByIdAndUpdate(
          ticket.eventId,
          {
            $inc: { ticketsSold: ticket.quantity },
          },
          { session: mongoSession },
        )
      }

      await mongoSession.commitTransaction()
      console.log(
        `Successfully processed payment for session: ${sessionWithDetails.id}`,
      )
    } catch (error) {
      await mongoSession.abortTransaction()
      throw error
    } finally {
      mongoSession.endSession()
    }
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Checkout processing failed: ${error.message}`,
    )
  }
}

const handleCheckoutSessionExpired = async (session: any): Promise<void> => {
  const mongoSession = await Payment.startSession()
  mongoSession.startTransaction()

  try {
    const payment = await Payment.findOne({
      $or: [
        { paymentIntentId: session.id },
        { 'metadata.checkoutSessionId': session.id },
      ],
    }).session(mongoSession)

    if (payment) {
      payment.status = 'failed'
      payment.metadata = { ...payment.metadata, ...session, expired: true }
      await payment.save({ session: mongoSession })

      await Ticket.findByIdAndUpdate(
        payment.ticketId,
        {
          paymentStatus: 'failed',
          status: 'cancelled',
        },
        { session: mongoSession },
      )
    }

    await mongoSession.commitTransaction()
  } catch (error) {
    await mongoSession.abortTransaction()
    throw error
  } finally {
    mongoSession.endSession()
  }
}

const handlePaymentSuccess = async (paymentIntent: any): Promise<void> => {
  const mongoSession = await Payment.startSession()
  mongoSession.startTransaction()


  console.log(paymentIntent)

  try {
    const payment = await Payment.findOne({
      userEmail: paymentIntent.customer_email,
    }).session(mongoSession)

    if (!payment) {
      throw new Error(`${paymentIntent.id}`)
    }

    // Check if already processed
    if (payment.status === 'succeeded') {
      await mongoSession.commitTransaction()
      return
    }

    // Update payment
    payment.status = 'succeeded'
    payment.paymentIntentId = paymentIntent.id
    payment.metadata = { ...payment.metadata, ...paymentIntent }
    await payment.save({ session: mongoSession })

    // Update ticket
    await Ticket.findByIdAndUpdate(
      payment.ticketId,
      {
        status: 'confirmed',
        paymentStatus: 'paid',
      },
      { session: mongoSession },
    )

    // Update event
    const ticket = await Ticket.findById(payment.ticketId).session(mongoSession)
    if (ticket) {
      await Event.findByIdAndUpdate(
        ticket.eventId,
        {
          $inc: { ticketsSold: ticket.quantity },
        },
        { session: mongoSession },
      )
    }

    await mongoSession.commitTransaction()
    console.log(`Successfully processed payment intent: ${paymentIntent.id}`)
  } catch (error) {
    await mongoSession.abortTransaction()
    throw error
  } finally {
    mongoSession.endSession()
  }
}

const handlePaymentFailure = async (paymentIntent: any): Promise<void> => {
  const mongoSession = await Payment.startSession()
  mongoSession.startTransaction()

  try {
    const payment = await Payment.findOne({
      paymentIntentId: paymentIntent.id,
    }).session(mongoSession)

    if (payment) {
      payment.status = 'failed'
      payment.metadata = { ...payment.metadata, ...paymentIntent }
      await payment.save({ session: mongoSession })

      await Ticket.findByIdAndUpdate(
        payment.ticketId,
        {
          paymentStatus: 'failed',
          status: 'cancelled',
        },
        { session: mongoSession },
      )
    }

    await mongoSession.commitTransaction()
  } catch (error) {
    await mongoSession.abortTransaction()
    throw error
  } finally {
    mongoSession.endSession()
  }
}

export const WebhookService = {
  handleWebhook: async (payload: any): Promise<void> => {
    try {
      const event = JSON.parse(payload.body.toString())
      console.log(`Processing webhook: ${event.type}`)

      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object)
          break
        case 'checkout.session.expired':
          await handleCheckoutSessionExpired(event.data.object)
          break
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object)
          break
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error: any) {
      console.error('Webhook processing error:', error)
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Webhook processing failed: ${error.message}`,
      )
    }
  },
}
