import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { Types } from 'mongoose'
import { ISavedEvent } from './savedEvent.interface'
import { SavedEvent } from './savedEvent.model'
import { savedEventSearchableFields } from './savedEvent.constants'
import { ISavedEventFilterables } from './savedEvent.interface'

const createSavedEvent = async (
  user: JwtPayload,
  payload: ISavedEvent,
): Promise<ISavedEvent> => {
  try {
    const result = await SavedEvent.create({ ...payload, user: user.authId })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create SavedEvent, please try again with valid data.',
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

const getAllSavedEvents = async (
  user: JwtPayload,
  filterables: ISavedEventFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, filter = 'all', ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Add user condition
  andConditions.push({ user: user.authId })

  // Search functionality (if you have searchable fields later)
  if (searchTerm && savedEventSearchableFields.length > 0) {
    andConditions.push({
      $or: savedEventSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality (other filters)
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  // Get saved events with event population
  const savedEventsQuery = SavedEvent.find(whereConditions)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder })
    .populate({
      path: 'event',
      match: filter !== 'all' ? getDateMatchCondition(filter) : {},
    })

  const savedEvents = await savedEventsQuery

  // Filter out events that didn't match the population filter
  const filteredSavedEvents = savedEvents.filter(se => se.event !== null)

  // Get total count with the same filter (for pagination)
  let totalQuery
  if (filter !== 'all') {
    // Need to count only events that match the date filter
    const savedEventsForCount = await SavedEvent.find(whereConditions).populate(
      {
        path: 'event',
        match: getDateMatchCondition(filter),
        select: '_id',
      },
    )
    totalQuery = savedEventsForCount.filter(se => se.event !== null).length
  } else {
    totalQuery = SavedEvent.countDocuments(whereConditions)
  }

  const total = await totalQuery

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredSavedEvents,
  }
}

// Helper function for date filtering
const getDateMatchCondition = (filter: string) => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  switch (filter) {
    case 'upcoming':
      return { startDate: { $gte: today } }
    case 'past':
      return { startDate: { $lt: today } }
    case 'today':
      return { startDate: today }
    default:
      return {}
  }
}

const getSingleSavedEvent = async (id: string): Promise<ISavedEvent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid SavedEvent ID')
  }

  const result = await SavedEvent.findById(id)
    .populate('user')
    .populate('event')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested savedEvent not found, please try again with valid id',
    )
  }

  return result
}

const updateSavedEvent = async (
  id: string,
  payload: Partial<ISavedEvent>,
): Promise<ISavedEvent | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid SavedEvent ID')
  }

  const result = await SavedEvent.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('user')
    .populate('event')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested savedEvent not found, please try again with valid id',
    )
  }

  return result
}

const deleteSavedEvent = async (id: string): Promise<ISavedEvent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid SavedEvent ID')
  }

  const result = await SavedEvent.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting savedEvent, please try again with valid id.',
    )
  }

  return result
}

export const SavedEventServices = {
  createSavedEvent,
  getAllSavedEvents,
  getSingleSavedEvent,
  updateSavedEvent,
  deleteSavedEvent,
}
