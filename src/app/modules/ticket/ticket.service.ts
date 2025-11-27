import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ITicketFilterables, ITicket } from './ticket.interface';
import { Ticket } from './ticket.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { ticketSearchableFields } from './ticket.constants';
import { Types } from 'mongoose';


const createTicket = async (
  user: JwtPayload,
  payload: ITicket
): Promise<ITicket> => {
  try {
    const result = await Ticket.create(payload);
    if (!result) {
      
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Ticket, please try again with valid data.'
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

const getAllTickets = async (
  user: JwtPayload,
  filterables: ITicketFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: ticketSearchableFields.map((field) => ({
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
    Ticket
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }).populate('_id').populate('eventId').populate('attendeeId'),
    Ticket.countDocuments(whereConditions),
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

const getSingleTicket = async (id: string): Promise<ITicket> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Ticket ID');
  }

  const result = await Ticket.findById(id).populate('_id').populate('eventId').populate('attendeeId');
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested ticket not found, please try again with valid id'
    );
  }

  return result;
};

const updateTicket = async (
  id: string,
  payload: Partial<ITicket>
): Promise<ITicket | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Ticket ID');
  }

  const result = await Ticket.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    }
  ).populate('_id').populate('eventId').populate('attendeeId');

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested ticket not found, please try again with valid id'
    );
  }

  return result;
};

const deleteTicket = async (id: string): Promise<ITicket> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Ticket ID');
  }

  const result = await Ticket.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting ticket, please try again with valid id.'
    );
  }

  return result;
};

export const TicketServices = {
  createTicket,
  getAllTickets,
  getSingleTicket,
  updateTicket,
  deleteTicket,
};