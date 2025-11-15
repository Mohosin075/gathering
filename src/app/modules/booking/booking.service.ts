import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IBookingFilterables, IBooking } from './booking.interface'
import { Booking } from './booking.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { bookingSearchableFields } from './booking.constants'
import { Types } from 'mongoose'

const createBooking = async (
  user: JwtPayload,
  payload: IBooking,
): Promise<IBooking> => {
  try {
    const result = await Booking.create({ ...payload, user: user.authId })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Booking, please try again with valid data.',
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

const getAllBookings = async (
  user: JwtPayload,
  filterables: IBookingFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: bookingSearchableFields.map(field => ({
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

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Booking.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -authentication',
      }),
    Booking.countDocuments(whereConditions),
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

const getSingleBooking = async (id: string): Promise<IBooking> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const result = await Booking.findById(id).populate({
    path: 'user',
    select: '-password -__v -createdAt -updatedAt -authentication',
  })
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested booking not found, please try again with valid id',
    )
  }

  return result
}

const updateBooking = async (
  id: string,
  payload: Partial<IBooking>,
): Promise<IBooking | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const result = await Booking.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate('user')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested booking not found, please try again with valid id',
    )
  }

  return result
}

const deleteBooking = async (id: string): Promise<IBooking> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Booking ID')
  }

  const result = await Booking.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting booking, please try again with valid id.',
    )
  }

  return result
}

// for staff to view their services
const myServices = async (
  user: JwtPayload,
  filterables: IBookingFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: bookingSearchableFields.map(field => ({
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

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Booking.find({ ...whereConditions, staff: user.authId })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -authentication',
      }),
    Booking.countDocuments(whereConditions),
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

const getBookingsByDate = async (date: string): Promise<IBooking[]> => {

  console.log(date, 'hit')


  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const bookings = await Booking.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  })

  return bookings
}

export const BookingServices = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  myServices,
  getBookingsByDate,
}
