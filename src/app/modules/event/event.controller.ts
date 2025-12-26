import { Request, Response } from 'express'
import { EventServices } from './event.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { eventFilterables, nearbyEventFilterables } from './event.constants'
import { paginationFields } from '../../../interfaces/pagination'

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const eventData = req.body

  const result = await EventServices.createEvent(req.user!, eventData)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Event created successfully',
    data: result,
  })
})

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const eventData = req.body

  const result = await EventServices.updateEvent(id, eventData, req.user!)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  })
})

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await EventServices.getSingleEvent(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event retrieved successfully',
    data: result,
  })
})

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, eventFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await EventServices.getAllEvents(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Events retrieved successfully',
    data: result,
  })
})
const getMyEvents = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, eventFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await EventServices.getMyEvents(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'My Events retrieved successfully',
    data: result,
  })
})

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await EventServices.deleteEvent(id, req.user!)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  })
})

const getNearbyEvents = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, nearbyEventFilterables)
  const pagination = pick(req.query, paginationFields)
  const data = {
    lat: Number(req.body.lat),
    lng: Number(req.body.lng),
    distance: Number(req.body.distance) || 1000,
    tags: req.body.tags
      ? Array.isArray(req.body.tags)
        ? (req.body.tags as string[])
        : (req.body.tags as string).split(',')
      : undefined,
  }

  const result = await EventServices.getNearbyEvents(
    req.user!,
    filterables,
    pagination,
    data,
  )

  // Send response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Nearby events retrieved successfully',
    data: result,
  })
})

export const EventController = {
  createEvent,
  updateEvent,
  getSingleEvent,
  getAllEvents,
  deleteEvent,
  getMyEvents,
  getNearbyEvents,
}
