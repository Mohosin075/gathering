import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IAgreementFilterables, IAgreement } from './agreement.interface'
import { Agreement } from './agreement.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { agreementSearchableFields } from './agreement.constants'
import { Types } from 'mongoose'

const createAgreement = async (
  user: JwtPayload,
  payload: IAgreement,
): Promise<IAgreement> => {
  try {
    const result = await Agreement.create({ ...payload, clientId: user.authId })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Agreement, please try again with valid data.',
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

const getAllAgreements = async (
  user: JwtPayload,
  filterables: IAgreementFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: agreementSearchableFields.map(field => ({
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
    Agreement.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('clientId'),
    Agreement.countDocuments(whereConditions),
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

const getSingleAgreement = async (id: string): Promise<IAgreement> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Agreement ID')
  }

  const result = await Agreement.findById(id).populate('clientId')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested agreement not found, please try again with valid id',
    )
  }

  return result
}

const updateAgreement = async (
  id: string,
  payload: Partial<IAgreement>,
): Promise<IAgreement | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Agreement ID')
  }

  const result = await Agreement.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate('clientId')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested agreement not found, please try again with valid id',
    )
  }

  return result
}

const deleteAgreement = async (id: string): Promise<IAgreement> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Agreement ID')
  }

  const result = await Agreement.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting agreement, please try again with valid id.',
    )
  }

  return result
}

export const AgreementServices = {
  createAgreement,
  getAllAgreements,
  getSingleAgreement,
  updateAgreement,
  deleteAgreement,
}
