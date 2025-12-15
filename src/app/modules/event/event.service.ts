import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IEventFilterables, IEvent, INearbyOptions } from './event.interface'
import { Event } from './event.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { eventSearchableFields } from './event.constants'
import { Types } from 'mongoose'

const createEvent = async (
  user: JwtPayload,
  payload: IEvent,
): Promise<IEvent> => {
  try {
    const result = await Event.create({
      ...payload,
      organizerId: user.authId, // always use the logged-in user
    })

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Event, please try again with valid data.',
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

const getAllEvents = async (
  user: JwtPayload,
  filterables: IEventFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)
  let whereConditions: any = {}

  // 🔥 FIXED: Properly typed arrays
  const searchConditions: any[] = []
  const filterConditions: any[] = []

  // Search functionality
  if (searchTerm && searchTerm.trim() !== '') {
    searchConditions.push({
      $or: eventSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm.trim(),
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality
  if (Object.keys(filterData).length > 0) {
    Object.entries(filterData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        filterConditions.push({ [key]: value })
      }
    })
  }

  // Combine conditions
  if (searchConditions.length > 0 && filterConditions.length > 0) {
    whereConditions = {
      $and: [...searchConditions, ...filterConditions],
    }
  } else if (searchConditions.length > 0) {
    whereConditions = { $and: searchConditions }
  } else if (filterConditions.length > 0) {
    whereConditions = { $and: filterConditions }
  }

  const [result, total] = await Promise.all([
    Event.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('organizerId'),
    Event.countDocuments(whereConditions),
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

const getMyEvents = async (
  user: JwtPayload,
  filterables: IEventFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  let whereConditions: any = {}

  // 🔥 FIXED: Properly typed arrays
  const searchConditions: any[] = []
  const filterConditions: any[] = []

  // Search functionality
  if (searchTerm && searchTerm.trim() !== '') {
    searchConditions.push({
      $or: eventSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm.trim(),
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality
  if (Object.keys(filterData).length > 0) {
    Object.entries(filterData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        filterConditions.push({ [key]: value })
      }
    })
  }

  // Combine conditions
  if (searchConditions.length > 0 && filterConditions.length > 0) {
    whereConditions = {
      $and: [...searchConditions, ...filterConditions],
    }
  } else if (searchConditions.length > 0) {
    whereConditions = { $and: searchConditions }
  } else if (filterConditions.length > 0) {
    whereConditions = { $and: filterConditions }
  }

  // Add organizer filter to only get current user's events
  const finalConditions = {
    ...whereConditions,
    organizerId: user.authId,
  }

  const [result, total] = await Promise.all([
    Event.find(finalConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('organizerId'),
    Event.countDocuments(finalConditions),
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

const getSingleEvent = async (id: string): Promise<IEvent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID')
  }

  const result = await Event.findById(id).populate('organizerId')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested event not found, please try again with valid id',
    )
  }

  return result
}

const updateEvent = async (
  id: string,
  payload: Partial<IEvent>,
): Promise<IEvent | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID')
  }

  const result = await Event.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate('organizerId')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested event not found, please try again with valid id',
    )
  }

  return result
}

const deleteEvent = async (id: string): Promise<IEvent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID')
  }

  const result = await Event.findByIdAndUpdate(
    id,
    { status: 'archived' }, // soft-delete
    { new: true, runValidators: true },
  ).populate('organizerId')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Event not found or could not be archived, please try again with a valid ID.',
    )
  }

  return result
}

const getNearbyEvents = async (
  user: JwtPayload,
  filterables: IEventFilterables,
  pagination: IPaginationOptions,
  data: INearbyOptions,
) => {
  const { searchTerm, category, ...otherFilters } = filterables
  const { lat, lng, distance = 10, tags } = data
  const {
    page,
    limit,
    sortBy = 'startDate',
    sortOrder = 'asc',
  } = paginationHelper.calculatePagination(pagination)

  const latitude = Number(lat)
  const longitude = Number(lng)
  const dist = Number(distance)

  console.log(latitude, longitude, dist)

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid latitude or longitude')
  }

  // Initial Match for $geoNear
  const geoNearMatch: any = {
    status: 'approved',
    visibility: 'public',
  }

  // Dynamic Filters Match
  const matchStage: any = { $and: [] }

  // Search
  if (searchTerm) {
    matchStage.$and.push({
      $or: eventSearchableFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    })
  }

  // Filters
  if (category) matchStage.$and.push({ category })
  if (tags && tags.length > 0) matchStage.$and.push({ tags: { $in: tags } })

  // Other dynamic filters
  if (Object.keys(otherFilters).length > 0) {
    Object.entries(otherFilters).forEach(([key, value]) => {
      matchStage.$and.push({ [key]: value })
    })
  }

  // If no match conditions, remove $and to avoid empty array error
  if (matchStage.$and.length === 0) delete matchStage.$and

  const pipeline: any[] = [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        maxDistance: dist * 1000, // convert km to meters
        query: geoNearMatch,
        spherical: true,
      },
    },
  ]

  // Add match stage if we have conditions
  if (matchStage.$and) {
    pipeline.push({ $match: matchStage })
  }

  // Facet for Data and Count
  pipeline.push({
    $facet: {
      data: [
        { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        // Lookup Organizer
        {
          $lookup: {
            from: 'users',
            localField: 'organizerId',
            foreignField: '_id',
            as: 'organizerId',
          },
        },
        { $unwind: { path: '$organizerId', preserveNullAndEmptyArrays: true } },
        // Sanitize Organizer (similar to model transform)
        {
          $project: {
            'organizerId.password': 0,
            'organizerId.createdAt': 0,
            'organizerId.updatedAt': 0,
            'organizerId.__v': 0,
          },
        },
      ],
      total: [{ $count: 'count' }],
    },
  })

  const result = await Event.aggregate(pipeline)

  const dataResult = result[0].data
  const total = result[0].total[0]?.count || 0

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: dataResult,
  }
}

export const EventServices = {
  createEvent,
  getAllEvents,
  getSingleEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getNearbyEvents,
}
