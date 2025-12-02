import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { AttendeeServices } from './attendee.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import pick from '../../../shared/pick'
import { IAttendeeFilterables } from './attendee.interface'
import { attendeeFilterableFields } from './attendee.constants'
import { JwtPayload } from 'jsonwebtoken'
import { paginationFields } from '../../../interfaces/pagination'

const createAttendee = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await AttendeeServices.createAttendee(user, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Registered as attendee successfully',
    data: result,
  })
})

const getAllAttendees = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const filters = pick(req.query, paginationFields) as IAttendeeFilterables
  const paginationOptions = pick(req.query, attendeeFilterableFields)

  const result = await AttendeeServices.getAllAttendees(
    user,
    filters,
    paginationOptions,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Attendees retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const getSingleAttendee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await AttendeeServices.getSingleAttendee(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Attendee retrieved successfully',
    data: result,
  })
})

const updateAttendee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await AttendeeServices.updateAttendee(id, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Attendee updated successfully',
    data: result,
  })
})

const deleteAttendee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await AttendeeServices.deleteAttendee(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Attendee deleted successfully',
    data: result,
  })
})

const checkInAttendee = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await AttendeeServices.checkInAttendee(user, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Attendee checked in successfully',
    data: result,
  })
})

const getEventAttendees = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params
  const paginationOptions = pick(req.query, paginationFields)

  const result = await AttendeeServices.getEventAttendees(
    eventId,
    paginationOptions,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event attendees retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const getMyAttendees = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const paginationOptions = pick(req.query, paginationFields)

  const result = await AttendeeServices.getMyAttendees(user, paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'My attendees retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

export const AttendeeController = {
  createAttendee,
  getAllAttendees,
  getSingleAttendee,
  updateAttendee,
  deleteAttendee,
  checkInAttendee,
  getEventAttendees,
  getMyAttendees,
}
