import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { ITicketFilterables, ITicket } from './ticket.interface'
import { Ticket } from './ticket.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { ticketSearchableFields } from './ticket.constants'
import { Types } from 'mongoose'
import { Event } from '../event/event.model'
import { Promotion } from '../promotion/promotion.model'
import { emailHelper } from '../../../helpers/emailHelper'
import { emailTemplate } from '../../../shared/emailTemplate'

const generateTicketNumber = (): string => {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const generateQRCode = (): string => {
  return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const createTicket = async (
  user: JwtPayload,
  payload: any,
): Promise<ITicket> => {
  try {
    // Verify event exists
    const event = await Event.findById(payload.eventId)
    if (!event) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found')
    }

    // Check event capacity
    if (event.ticketsSold + payload.quantity > event.capacity) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Event capacity exceeded')
    }

    let discountAmount = 0
    let finalAmount = payload.price * payload.quantity

    // Apply promotion if provided
    if (payload.promotionCode) {
      const promotion = await Promotion.findByCode(payload.promotionCode)
      if (promotion && promotion.isValid()) {
        if (promotion.canUse(user.authId)) {
          if (promotion.discountType === 'percentage') {
            discountAmount = (finalAmount * promotion.discountValue) / 100
          } else {
            discountAmount = promotion.discountValue
          }
          finalAmount = Math.max(0, finalAmount - discountAmount)

          // Mark promotion as used
          await promotion.markAsUsed(user.authId)
        }
      }
    }

    const ticketData = {
      ...payload,
      attendeeId: user.authId,
      totalAmount: payload.price * payload.quantity,
      discountAmount,
      finalAmount,
      qrCode: generateQRCode(),
      ticketNumber: generateTicketNumber(),
    }

    const result = await Ticket.create(ticketData)

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create ticket, please try again with valid data.',
      )
    }

    // Update event tickets sold count
    await Event.findByIdAndUpdate(payload.eventId, {
      $inc: { ticketsSold: payload.quantity },
    })

    return result
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate ticket found')
    }
    throw error
  }
}

const getAllTickets = async (
  user: JwtPayload,
  filterables: ITicketFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: ticketSearchableFields.map(field => ({
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

  // Regular users can only see their own tickets
  if (user.role === 'user' || user.role === 'organizer') {
    andConditions.push({
      attendeeId: new Types.ObjectId(user.authId),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Ticket.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('eventId')
      .populate('attendeeId', 'name email'),
    Ticket.countDocuments(whereConditions),
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

const getSingleTicket = async (id: string): Promise<ITicket> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Ticket ID')
  }

  const result = await Ticket.findById(id)
    .populate('eventId')
    .populate('attendeeId', 'name email')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested ticket not found, please try again with valid id',
    )
  }

  return result
}

const updateTicket = async (
  id: string,
  payload: Partial<ITicket>,
): Promise<ITicket | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Ticket ID')
  }

  const result = await Ticket.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('eventId')
    .populate('attendeeId', 'name email')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested ticket not found, please try again with valid id',
    )
  }

  // Send email if status is confirmed
  if (payload.status === 'confirmed' && result.status === 'confirmed') {
    const event = result.eventId as any
    const attendee = result.attendeeId as any

    if (attendee && attendee.email) {
      // Generate basic QR code URL (placeholder or use actual logic if available)
      // Since the model stores just a string for QR code, we might need to assume it's a value to be rendered or a URL.
      // For now, I'll pass the stored value.

      await emailHelper.sendEmail(
        emailTemplate.ticketConfirmed({
          name: attendee.name,
          email: attendee.email,
          eventName: event.title,
          ticketNumber: result.ticketNumber,
          ticketType: result.ticketType,
          quantity: result.quantity,
          qrCode: result.qrCode,
        }),
      )
    }
  }

  return result
}

const deleteTicket = async (id: string): Promise<ITicket> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Ticket ID')
  }

  const result = await Ticket.findByIdAndUpdate(
    id,
    { status: 'cancelled' }, // soft-delete
    { new: true, runValidators: true },
  )
    .populate('eventId')
    .populate('attendeeId', 'name email')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Ticket not found or could not be cancelled, please try again with a valid ID.',
    )
  }

  // Update event tickets sold count
  await Event.findByIdAndUpdate(result.eventId, {
    $inc: { ticketsSold: -result.quantity },
  })

  return result
}

const checkInTicket = async (ticketId: string): Promise<ITicket> => {
  const ticket = await Ticket.findOne({ _id: ticketId })
    .populate('eventId')
    .populate('attendeeId', 'name email')

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid QR code')
  }

  if (ticket.checkedIn) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket already checked in')
  }

  if (ticket.status !== 'confirmed') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket is not confirmed')
  }

  if (ticket.paymentStatus !== 'paid') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket is not paid')
  }

  const result = await Ticket.findByIdAndUpdate(
    ticket._id,
    {
      checkedIn: true,
      checkedInAt: new Date(),
    },
    { new: true, runValidators: true },
  )
    .populate('eventId')
    .populate('attendeeId', 'name email')

  return result!
}

const getMyTickets = async (
  user: JwtPayload,
  pagination: IPaginationOptions,
) => {
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const [result, total] = await Promise.all([
    Ticket.find({ attendeeId: new Types.ObjectId(user.authId) })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('eventId')
      .populate('attendeeId', 'name email'),
    Ticket.countDocuments({ attendeeId: new Types.ObjectId(user.authId) }),
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

export const TicketServices = {
  createTicket,
  getAllTickets,
  getSingleTicket,
  updateTicket,
  deleteTicket,
  checkInTicket,
  getMyTickets,
}
