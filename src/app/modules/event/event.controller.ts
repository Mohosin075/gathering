import { Request, Response } from 'express';
import { EventServices } from './event.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { eventFilterables } from './event.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const eventData = req.body;

  const result = await EventServices.createEvent(
    req.user!,
    eventData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Event created successfully',
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const eventData = req.body;

  const result = await EventServices.updateEvent(id, eventData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  });
});

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventServices.getSingleEvent(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event retrieved successfully',
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, eventFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await EventServices.getAllEvents(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Events retrieved successfully',
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventServices.deleteEvent(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  });
});

export const EventController = {
  createEvent,
  updateEvent,
  getSingleEvent,
  getAllEvents,
  deleteEvent,
};