import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IPaymentFilterables, IPayment } from './payment.interface'
import { Payment } from './payment.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { paymentSearchableFields } from './payment.constants'
import { Types } from 'mongoose'
import { Ticket } from '../ticket/ticket.model'
import { Event } from '../event/event.model'
import stripe from '../../../config/stripe'
import config from '../../../config'

const createCheckoutSession = async (
  user: any, // Replace with your JwtPayload type
  payload: any,
): Promise<{ sessionId: string; url: string }> => {
  try {
    const ticket = await Ticket.findOne({
      _id: payload.ticketId,
      attendeeId: user.authId,
    }).populate('eventId')

    if (!ticket) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found')
    }

    if (ticket.status === 'cancelled') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket is cancelled')
    }

    if (ticket.paymentStatus === 'paid') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket already paid')
    }

    const event = ticket.eventId as any

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: payload.currency || 'usd',
            product_data: {
              name: `Ticket for ${event.title}`,
              description: `Event: ${event.title} | Ticket Type: ${ticket.ticketType} | Quantity: ${ticket.quantity}`,
              images:
                event.images && event.images.length > 0
                  ? [event.images[0]]
                  : [],
            },
            unit_amount: Math.round(ticket.finalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${config.clientUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/payment/cancel`,
      customer_email: user.email,
      metadata: {
        ticketId: payload.ticketId,
        authId: user.authId,
        eventId: event._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    })

    // Create payment record with consistent ID storage
    await Payment.create({
      ticketId: payload.ticketId,
      userId: user.authId,
      userEmail: user.email,
      eventId: event._id,
      amount: ticket.finalAmount,
      currency: payload.currency || 'USD',
      paymentMethod: 'stripe',
      paymentIntentId: session.payment_intent || session.id, // Primary lookup field
      status: 'pending',
      metadata: {
        checkoutSessionId: session.id, // Secondary lookup field
        successUrl: session.success_url,
        cancelUrl: session.cancel_url,
        ticketId: payload.ticketId,
        authId: user.authId,
        eventId: event._id.toString(),
      },
    })

    return {
      sessionId: session.id,
      url: session.url!,
    }
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Checkout session creation failed: ${error.message}`,
    )
  }
}

const verifyCheckoutSession = async (sessionId: string): Promise<IPayment> => {
  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    // Find payment record
    const payment = await Payment.findOne({ paymentIntentId: sessionId })
      .populate('ticketId')
      .populate('userId', 'name email')
      .populate('eventId', 'title startDate')

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found')
    }

    // Update payment status based on session
    if (session.payment_status === 'paid' && payment.status !== 'succeeded') {
      const session = await Payment.startSession()
      session.startTransaction()

      try {
        // Update payment status
        payment.status = 'succeeded'
        payment.metadata = { ...payment.metadata, session }
        await payment.save({ session })

        // Update ticket status
        await Ticket.findByIdAndUpdate(
          payment.ticketId,
          {
            status: 'confirmed',
            paymentStatus: 'paid',
          },
          { session },
        )

        // Update event tickets sold count
        const ticket = await Ticket.findById(payment.ticketId).session(session)
        if (ticket) {
          await Event.findByIdAndUpdate(
            ticket.eventId,
            {
              $inc: { ticketsSold: ticket.quantity },
            },
            { session },
          )
        }

        await session.commitTransaction()
      } catch (error) {
        await session.abortTransaction()
        throw error
      } finally {
        session.endSession()
      }
    } else if (
      session.payment_status === 'unpaid' &&
      payment.status !== 'failed'
    ) {
      payment.status = 'failed'
      await payment.save()
    }

    return payment
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Payment verification failed: ${error.message}`,
    )
  }
}

const getAllPayments = async (
  user: JwtPayload,
  filterables: IPaymentFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: paymentSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    })
  }

  // Regular users can only see their own payments
  if (user.role === 'user' || user.role === 'organizer') {
    andConditions.push({
      authId: new Types.ObjectId(user.authId),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Payment.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('ticketId')
      .populate('authId', 'name email')
      .populate('eventId', 'title startDate'),
    Payment.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const getSinglePayment = async (id: string): Promise<IPayment> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Payment ID')
  }

  const result = await Payment.findById(id)
    .populate('ticketId')
    .populate('authId', 'name email')
    .populate('eventId', 'title startDate')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested payment not found, please try again with valid id',
    )
  }

  return result
}

const updatePayment = async (
  id: string,
  payload: Partial<IPayment>,
): Promise<IPayment | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Payment ID')
  }

  const result = await Payment.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('ticketId')
    .populate('authId', 'name email')
    .populate('eventId', 'title startDate')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested payment not found, please try again with valid id',
    )
  }

  return result
}

const refundPayment = async (
  id: string,
  reason?: string,
): Promise<IPayment> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Payment ID')
  }

  const payment = await Payment.findById(id)
  if (!payment) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found')
  }

  if (payment.status !== 'succeeded') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Only successful payments can be refunded',
    )
  }

  // Process refund via Stripe
  try {
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      amount: Math.round(payment.amount * 100),
      reason: reason ? 'requested_by_customer' : 'duplicate',
    })

    const result = await Payment.findByIdAndUpdate(
      id,
      {
        status: 'refunded',
        refundAmount: payment.amount,
        refundReason: reason,
        metadata: { ...payment.metadata, refundId: refund.id },
      },
      { new: true, runValidators: true },
    )
      .populate('ticketId')
      .populate('authId', 'name email')
      .populate('eventId', 'title startDate')

    // Update ticket status
    if (result) {
      await Ticket.findByIdAndUpdate(payment.ticketId, {
        status: 'refunded',
        paymentStatus: 'refunded',
      })

      // Update event tickets sold count
      const ticket = await Ticket.findById(payment.ticketId)
      if (ticket) {
        await Event.findByIdAndUpdate(ticket.eventId, {
          $inc: { ticketsSold: -ticket.quantity },
        })
      }
    }

    return result!
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Refund failed: ${error.message}`,
    )
  }
}

const getMyPayments = async (
  user: JwtPayload,
  pagination: IPaginationOptions,
) => {
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const [result, total] = await Promise.all([
    Payment.find({ authId: new Types.ObjectId(user.authId) })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('ticketId')
      .populate('authId', 'name email')
      .populate('eventId', 'title startDate'),
    Payment.countDocuments({ authId: new Types.ObjectId(user.authId) }),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

export const PaymentServices = {
  getAllPayments,
  getSinglePayment,
  updatePayment,
  refundPayment,
  getMyPayments,
  createCheckoutSession,
  verifyCheckoutSession,
}
