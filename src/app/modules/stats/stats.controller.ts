import { Request, Response } from 'express'
import { EventStatsServices } from './stats.service'

const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const data = await EventStatsServices.getAdminDashboardStats()

    res.status(200).json({
      success: true,
      message: 'Admin dashboard stats fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getEventStats = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6
    const data = await EventStatsServices.getEventStats(months)

    res.status(200).json({
      success: true,
      message: 'Event statistics fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getUserStats = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6
    const data = await EventStatsServices.getUserStats(months)

    res.status(200).json({
      success: true,
      message: 'User statistics fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6
    const data = await EventStatsServices.getRevenueStats(months)

    res.status(200).json({
      success: true,
      message: 'Revenue statistics fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getEventStatusStats = async (req: Request, res: Response) => {
  try {
    const data = await EventStatsServices.getEventStatusStats()

    res.status(200).json({
      success: true,
      message: 'Event status statistics fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event status statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getAppSummary = async (req: Request, res: Response) => {
  try {
    const data = await EventStatsServices.getAppSummary()

    res.status(200).json({
      success: true,
      message: 'All statistics fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching summary statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const EventStatsController = {
  getAdminDashboardStats,
  getEventStats,
  getUserStats,
  getRevenueStats,
  getEventStatusStats,
  getAppSummary,
}
