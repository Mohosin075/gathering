import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IUsereventFilterables, IUserevent } from './userevent.interface';
import { Userevent } from './userevent.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { usereventSearchableFields } from './userevent.constants';
import { Types } from 'mongoose';


const createUserevent = async (
  user: JwtPayload,
  payload: IUserevent
): Promise<IUserevent> => {
  console.log({user})
  try {
    const result = await Userevent.create({...payload, createdBy: user.authId});
    if (!result) {
      
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Userevent, please try again with valid data.'
      );
    }

    return result;
  } catch (error: any) {
    
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const getAllUserevents = async (
  user: JwtPayload,
  filterables: IUsereventFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: usereventSearchableFields.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    });
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {};

  const [result, total] = await Promise.all([
    Userevent
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }).populate('venueId').populate('createdBy'),
    Userevent.countDocuments(whereConditions),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getSingleUserevent = async (id: string): Promise<IUserevent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Userevent ID');
  }

  const result = await Userevent.findById(id).populate('venueId').populate('createdBy');
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested userevent not found, please try again with valid id'
    );
  }

  return result;
};

const updateUserevent = async (
  id: string,
  payload: Partial<IUserevent>
): Promise<IUserevent | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Userevent ID');
  }

  const result = await Userevent.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    }
  ).populate('venueId').populate('createdBy');

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested userevent not found, please try again with valid id'
    );
  }

  return result;
};

const deleteUserevent = async (id: string): Promise<IUserevent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Userevent ID');
  }

  const result = await Userevent.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting userevent, please try again with valid id.'
    );
  }

  return result;
};

export const UsereventServices = {
  createUserevent,
  getAllUserevents,
  getSingleUserevent,
  updateUserevent,
  deleteUserevent,
};