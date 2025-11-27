import { Request, Response } from 'express';
import { TicketServices } from './ticket.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { ticketFilterables } from './ticket.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createTicket = catchAsync(async (req: Request, res: Response) => {
  const ticketData = req.body;

  const result = await TicketServices.createTicket(
    req.user!,
    ticketData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Ticket created successfully',
    data: result,
  });
});

const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ticketData = req.body;

  const result = await TicketServices.updateTicket(id, ticketData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ticket updated successfully',
    data: result,
  });
});

const getSingleTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TicketServices.getSingleTicket(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ticket retrieved successfully',
    data: result,
  });
});

const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, ticketFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await TicketServices.getAllTickets(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Tickets retrieved successfully',
    data: result,
  });
});

const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TicketServices.deleteTicket(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ticket deleted successfully',
    data: result,
  });
});

export const TicketController = {
  createTicket,
  updateTicket,
  getSingleTicket,
  getAllTickets,
  deleteTicket,
};