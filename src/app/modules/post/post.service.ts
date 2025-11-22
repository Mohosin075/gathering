import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IPostFilterables, IPost } from './post.interface'
import { Post } from './post.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { postSearchableFields } from './post.constants'
import { Types } from 'mongoose'

const createPost = async (user: JwtPayload, payload: IPost): Promise<IPost> => {
  try {
    const result = await Post.create({ ...payload, userId: user.authId })
    if (!result) {
      // removeUploadedFiles(payload.images || payload.media);
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Post, please try again with valid data.',
      )
    }

    return result
  } catch (error: any) {
    // if (payload.images || payload.media) removeUploadedFiles(payload.images || payload.media);
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

const getAllPosts = async (
  user: JwtPayload,
  filterables: IPostFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: postSearchableFields.map(field => ({
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
    Post.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('userId'),
    Post.countDocuments(whereConditions),
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

const getSinglePost = async (id: string): Promise<IPost> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID')
  }

  const result = await Post.findById(id).populate('userId')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested post not found, please try again with valid id',
    )
  }

  return result
}

const updatePost = async (
  id: string,
  payload: Partial<IPost>,
): Promise<IPost | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID')
  }

  const result = await Post.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate('userId')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested post not found, please try again with valid id',
    )
  }

  return result
}

const deletePost = async (id: string): Promise<IPost> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID')
  }

  const result = await Post.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting post, please try again with valid id.',
    )
  }

  return result
}

export const PostServices = {
  createPost,
  getAllPosts,
  getSinglePost,
  updatePost,
  deletePost,
}
