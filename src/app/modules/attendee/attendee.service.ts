import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IAttendeeFilterables, IAttendee } from './attendee.interface'
import { Attendee } from './attendee.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { attendeeSearchableFields } from './attendee.constants'
import { Types } from 'mongoose'
import { Ticket } from '../ticket/ticket.model'
import { Event } from '../event/event.model'
import { Payment } from '../payment/payment.model'

const createAttendee = async (
  user: JwtPayload,
  payload: any,
): Promise<IAttendee> => {
  try {
    const ticket = await Ticket.findOne({
      _id: payload.ticketId,
      attendeeId: user.authId,
    })

    if (!ticket) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found')
    }

    if (ticket.status !== 'confirmed') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket is not confirmed')
    }

    if (ticket.paymentStatus !== 'paid') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket is not paid')
    }

    const payment = await Payment.findOne({
      ticketId: payload.ticketId,
      userId: user.authId,
      status: 'succeeded',
    })

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found')
    }

    const existingAttendee = await Attendee.findOne({
      ticketId: payload.ticketId,
    })

    if (existingAttendee) {
      throw new ApiError(StatusCodes.CONFLICT, 'Attendee already registered')
    }

    const attendeeData = {
      eventId: ticket.eventId,
      userId: user.authId,
      ticketId: payload.ticketId,
      paymentId: payment._id,
      specialRequirements: payload.specialRequirements,
    }

    const result = await Attendee.create(attendeeData)

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to register as attendee',
      )
    }

    return result
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

const getAllAttendees = async (
  user: JwtPayload,
  filterables: IAttendeeFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  if (searchTerm) {
    andConditions.push({
      $or: attendeeSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    })
  }

  if (user.role === 'user') {
    andConditions.push({
      userId: new Types.ObjectId(user.authId),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Attendee.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('eventId', 'title startDate locationType')
      .populate('userId', 'name email phone')
      .populate('ticketId', 'ticketType ticketNumber')
      .populate('paymentId', 'amount currency')
      .populate('checkInBy', 'name'),
    Attendee.countDocuments(whereConditions),
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

const getSingleAttendee = async (id: string): Promise<IAttendee> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Attendee ID')
  }

  const result = await Attendee.findById(id)
    .populate('eventId', 'title startDate locationType')
    .populate('userId', 'name email phone')
    .populate('ticketId', 'ticketType ticketNumber')
    .populate('paymentId', 'amount currency')
    .populate('checkInBy', 'name')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Attendee not found, please try again with valid id',
    )
  }

  return result
}

const updateAttendee = async (
  id: string,
  payload: Partial<IAttendee>,
): Promise<IAttendee | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Attendee ID')
  }

  const result = await Attendee.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('eventId', 'title startDate locationType')
    .populate('userId', 'name email phone')
    .populate('ticketId', 'ticketType ticketNumber')
    .populate('paymentId', 'amount currency')
    .populate('checkInBy', 'name')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Attendee not found, please try again with valid id',
    )
  }

  return result
}

const checkInAttendee = async (
  user: JwtPayload,
  data: any,
): Promise<IAttendee> => {
  let attendee

  if (data.attendeeId) {
    attendee = await Attendee.findById(data.attendeeId)
  } else if (data.ticketId) {
    attendee = await Attendee.findOne({ ticketId: data.ticketId })
  } else if (data.qrCode) {
    const ticket = await Ticket.findOne({ qrCode: data.qrCode })
    if (ticket) {
      attendee = await Attendee.findOne({ ticketId: ticket._id })
    }
  }

  if (!attendee) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Attendee not found')
  }

  if (attendee.checkInStatus) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Attendee already checked in')
  }

  const result = await Attendee.findByIdAndUpdate(
    attendee._id,
    {
      checkInStatus: true,
      checkInTime: new Date(),
      checkInBy: user.authId,
    },
    { new: true, runValidators: true },
  )
    .populate('eventId', 'title startDate locationType')
    .populate('userId', 'name email phone')
    .populate('ticketId', 'ticketType ticketNumber')
    .populate('paymentId', 'amount currency')
    .populate('checkInBy', 'name')

  if (result) {
    // Sync with Ticket record
    await Ticket.findByIdAndUpdate(result.ticketId, {
      checkedIn: true,
      checkedInAt: result.checkInTime,
    })
  }

  return result!
}

const deleteAttendee = async (id: string): Promise<IAttendee> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Attendee ID')
  }

  const result = await Attendee.findByIdAndDelete(id)

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Attendee not found or could not be deleted',
    )
  }

  return result
}

const getEventAttendees = async (
  eventId: string,
  pagination: IPaginationOptions,
) => {
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const [result, total] = await Promise.all([
    Attendee.find({ eventId: new Types.ObjectId(eventId) })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('userId', 'name email phone')
      .populate('ticketId', 'ticketType ticketNumber')
      .populate('paymentId', 'amount currency')
      .populate('checkInBy', 'name'),
    Attendee.countDocuments({ eventId: new Types.ObjectId(eventId) }),
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

const getMyAttendees = async (
  user: JwtPayload,
  pagination: IPaginationOptions,
) => {
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const [result, total] = await Promise.all([
    Attendee.find({ userId: new Types.ObjectId(user.authId) })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('eventId', 'title startDate locationType')
      .populate('ticketId', 'ticketType ticketNumber')
      .populate('paymentId', 'amount currency')
      .populate('checkInBy', 'name'),
    Attendee.countDocuments({ userId: new Types.ObjectId(user.authId) }),
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

export const AttendeeServices = {
  createAttendee,
  getAllAttendees,
  getSingleAttendee,
  updateAttendee,
  deleteAttendee,
  checkInAttendee,
  getEventAttendees,
  getMyAttendees,
}
