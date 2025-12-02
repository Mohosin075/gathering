import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { paginationFields } from '../../../interfaces/pagination'
import { SavedEventServices } from './savedEvent.service'
import { savedEventFilterables } from './savedEvent.constants'

const createSavedEvent = catchAsync(async (req: Request, res: Response) => {
  const savedEventData = req.body

  const result = await SavedEventServices.createSavedEvent(
    req.user!,
    savedEventData,
  )

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'SavedEvent created successfully',
    data: result,
  })
})

const updateSavedEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const savedEventData = req.body

  const result = await SavedEventServices.updateSavedEvent(id, savedEventData)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'SavedEvent updated successfully',
    data: result,
  })
})

const getSingleSavedEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await SavedEventServices.getSingleSavedEvent(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'SavedEvent retrieved successfully',
    data: result,
  })
})

const getAllSavedEvents = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, savedEventFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await SavedEventServices.getAllSavedEvents(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'SavedEvents retrieved successfully',
    data: result,
  })
})

const deleteSavedEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await SavedEventServices.deleteSavedEvent(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'SavedEvent deleted successfully',
    data: result,
  })
})

export const SavedEventController = {
  createSavedEvent,
  updateSavedEvent,
  getSingleSavedEvent,
  getAllSavedEvents,
  deleteSavedEvent,
}
