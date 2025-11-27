import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { TicketServices } from './ticket.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import pick from '../../../shared/pick'
import { ITicketFilterables } from './ticket.interface'
import { ticketFilterableFields } from './ticket.constants'
import { paginationFields } from '../../../interfaces/pagination'
import { JwtPayload } from 'jsonwebtoken'

const createTicket = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await TicketServices.createTicket(user, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Ticket created successfully',
    data: result,
  })
})

const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const filters = pick(req.query, ticketFilterableFields) as ITicketFilterables
  const paginationOptions = pick(req.query, paginationFields)

  const result = await TicketServices.getAllTickets(
    user,
    filters,
    paginationOptions,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Tickets retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const getSingleTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await TicketServices.getSingleTicket(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ticket retrieved successfully',
    data: result,
  })
})

const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await TicketServices.updateTicket(id, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ticket updated successfully',
    data: result,
  })
})

const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await TicketServices.deleteTicket(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ticket cancelled successfully',
    data: result,
  })
})

const checkInTicket = catchAsync(async (req: Request, res: Response) => {
  const { ticketId } = req.body
  const result = await TicketServices.checkInTicket(ticketId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ticket checked in successfully',
    data: result,
  })
})

const getMyTickets = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const paginationOptions = pick(req.query, paginationFields)

  const result = await TicketServices.getMyTickets(user, paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'My tickets retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

export const TicketController = {
  createTicket,
  getAllTickets,
  getSingleTicket,
  updateTicket,
  deleteTicket,
  checkInTicket,
  getMyTickets,
}
