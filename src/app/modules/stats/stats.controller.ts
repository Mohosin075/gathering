import { Request, Response } from 'express'
import { EventStatsServices } from './stats.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import { IWeeklyEventStats, IUserEngagementStats } from './stats.interface'

const getAdminDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getAdminDashboardStats()

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin dashboard stats fetched successfully',
    data: result,
  })
})

const getEventStats = catchAsync(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6
  const result = await EventStatsServices.getEventStats(months)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event statistics fetched successfully',
    data: result,
  })
})

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6
  const result = await EventStatsServices.getUserStats(months)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User statistics fetched successfully',
    data: result,
  })
})

const getRevenueStats = catchAsync(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6
  const result = await EventStatsServices.getRevenueStats(months)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Revenue statistics fetched successfully',
    data: result,
  })
})

const getEventStatusStats = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getEventStatusStats()

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event status statistics fetched successfully',
    data: result,
  })
})

const getAppSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getAppSummary()

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'All statistics fetched successfully',
    data: result,
  })
})

const getOrganizerDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getOrganizerDashboardStats(
    (req.user as JwtPayload).authId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizer dashboard stats fetched successfully',
    data: result,
  })
})

const getOrganizerEventStats = catchAsync(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6
  const result = await EventStatsServices.getOrganizerEventStats(
    (req.user as JwtPayload).authId,
    months,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizer event statistics fetched successfully',
    data: result,
  })
})

const getOrganizerRevenueStats = catchAsync(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6
  const result = await EventStatsServices.getOrganizerRevenueStats(
    (req.user as JwtPayload).authId,
    months,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizer revenue statistics fetched successfully',
    data: result,
  })
})

const getOrganizerEventStatusStats = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getOrganizerEventStatusStats(
    (req.user as JwtPayload).authId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizer event status statistics fetched successfully',
    data: result,
  })
})

const getOrganizerAppSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getOrganizerAppSummary(
    (req.user as JwtPayload).authId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizer summary statistics fetched successfully',
    data: result,
  })
})

const getIndividualEventStats = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params
  const days = parseInt(req.query.days as string) || 7

  const result = await EventStatsServices.getIndividualEventStats(eventId, days)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Individual event statistics fetched successfully',
    data: result,
  })
})

const getEventAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params
  const result = await EventStatsServices.getEventAnalytics(eventId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event analytics fetched successfully',
    data: result,
  })
})

const getOrganizerPromotionStats = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getOrganizerPromotionStats(
    (req.user as JwtPayload).authId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizer promotion statistics fetched successfully',
    data: result,
  })
})

const getTopThreeRevenueEvents = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getTopThreeRevenueEvents()

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Top three revenue events fetched successfully',
    data: result,
  })
})

const getOrganizerUpcomingEvents = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getOrganizerUpcomingEvents(
    (req.user as JwtPayload).authId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizer upcoming events fetched successfully',
    data: result,
  })
})

const getContentModerationStats = catchAsync(async (req: Request, res: Response) => {
  const result = await EventStatsServices.getContentModerationStats()

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content moderation statistics fetched successfully',
    data: result,
  })
})

const getWeeklyEventCreatedStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await EventStatsServices.getWeeklyEventCreatedStats()

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Weekly event statistics fetched successfully',
      data: result,
    })
  },
)

const getUserEngagementStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await EventStatsServices.getUserEngagementStats()

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'User engagement statistics fetched successfully',
      data: result,
    })
  },
)

export const EventStatsController = {
  getAdminDashboardStats,
  getEventStats,
  getUserStats,
  getRevenueStats,
  getEventStatusStats,
  getAppSummary,
  getOrganizerDashboardStats,
  getOrganizerEventStats,
  getOrganizerRevenueStats,
  getOrganizerEventStatusStats,
  getOrganizerAppSummary,
  getIndividualEventStats,
  getEventAnalytics,
  getOrganizerPromotionStats,
  getTopThreeRevenueEvents,
  getOrganizerUpcomingEvents,
  getContentModerationStats,
  getWeeklyEventCreatedStats,
  getUserEngagementStats,
}
