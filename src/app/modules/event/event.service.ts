import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IEventFilterables, IEvent } from './event.interface';
import { Event } from './event.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { eventSearchableFields } from './event.constants';
import { Types } from 'mongoose';


const createEvent = async (
  user: JwtPayload,
  payload: IEvent
): Promise<IEvent> => {
  try {
    const result = await Event.create(payload);
    if (!result) {
      
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Event, please try again with valid data.'
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

const getAllEvents = async (
  user: JwtPayload,
  filterables: IEventFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: eventSearchableFields.map((field) => ({
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
    Event
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }).populate('organizerId'),
    Event.countDocuments(whereConditions),
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

const getSingleEvent = async (id: string): Promise<IEvent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID');
  }

  const result = await Event.findById(id).populate('organizerId');
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested event not found, please try again with valid id'
    );
  }

  return result;
};

const updateEvent = async (
  id: string,
  payload: Partial<IEvent>
): Promise<IEvent | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID');
  }

  const result = await Event.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    }
  ).populate('organizerId');

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested event not found, please try again with valid id'
    );
  }

  return result;
};

const deleteEvent = async (id: string): Promise<IEvent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID');
  }

  const result = await Event.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting event, please try again with valid id.'
    );
  }

  return result;
};

export const EventServices = {
  createEvent,
  getAllEvents,
  getSingleEvent,
  updateEvent,
  deleteEvent,
};