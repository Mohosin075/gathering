import { Event } from '../event/event.model'
import { Types } from 'mongoose'
import { User } from '../user/user.model'
import { Review } from '../review/review.model'
import { Follow } from '../follow/follow.model'
import { SavedEvent } from '../savedEvent/savedEvent.model'
import {
  IAdminStats,
  IEventStats,
  IUserStats,
  IEventStatusStats,
  IOrganizerStats,
  IIndividualEventStats,
  IEventAnalytics,
  IPromotionStats,
  IContentModerationStats,
  IWeeklyEventStats,
  IUserEngagementStats,
} from './stats.interface'
import { Promotion } from '../promotion/promotion.model'
import { Support } from '../support/support.model'
import { SUPPORT_STATUS } from '../../../enum/support'
import { EVENT_STATUS } from '../../../enum/event'
import { USER_ROLES } from '../../../enum/user'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'

// Helper function to get month name
const getMonthName = (monthIndex: number): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return months[monthIndex]
}

// Helper function to get day name
const getDayName = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

// Helper function to ensure all months are included
const fillMissingMonths = (
  data: Array<{ month: string; count?: number; revenue?: number }>,
  monthsCount: number = 6,
  type: 'count' | 'revenue' = 'count',
) => {
  const result = []
  const now = new Date()

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = getMonthName(d.getMonth())
    const existing = data.find(item => item.month === monthName)

    if (existing) {
      result.push(existing)
    } else {
      result.push({
        month: monthName,
        [type]: 0,
      })
    }
  }
  return result
}

// Get admin dashboard stats
export const getAdminDashboardStats = async (): Promise<IAdminStats> => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalUsers,
    activeEvents,
    eventsCreated,
    pendingReviews,
    lastMonthUsers,
    lastMonthEvents,
  ] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments({ status: EVENT_STATUS.PUBLISHED }),
    Event.countDocuments(),
    Review.countDocuments({ isApproved: false }),
    User.countDocuments({ createdAt: { $lt: startOfCurrentMonth, $gte: startOfLastMonth } }),
    Event.countDocuments({ createdAt: { $lt: startOfCurrentMonth, $gte: startOfLastMonth } }),
  ])

  const userGrowth = lastMonthUsers > 0 ? (totalUsers / lastMonthUsers) * 100 : 0
  const eventGrowth = lastMonthEvents > 0 ? (activeEvents / lastMonthEvents) * 100 : 0

  return {
    totalUsers,
    activeEvents,
    eventsCreated,
    pendingReviews,
    userGrowth,
    eventGrowth,
    eventsCreatedGrowth: 0,
    recentActivities: [],
  }
}

// Get event statistics
export const getEventStats = async (months: number = 6): Promise<IEventStats> => {
  const [
    totalEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    capacityData,
  ] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.APPROVED] } }),
    Event.countDocuments({ status: EVENT_STATUS.COMPLETED }),
    Event.countDocuments({ status: EVENT_STATUS.CANCELLED }),
    Event.aggregate([
      { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } }
    ]),
  ])

  return {
    totalEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    totalCapacity: capacityData[0]?.totalCapacity || 0,
    eventTrend: [],
    categoryDistribution: [],
  }
}

// Get user statistics
export const getUserStats = async (months: number = 6): Promise<IUserStats> => {
  const totalUsers = await User.countDocuments()
  return {
    totalUsers,
    activeUsers: totalUsers,
    newUsersThisMonth: 0,
    userGrowth: 0,
    userDistribution: {
      byRole: [],
      byStatus: [],
    },
    monthlySignups: [],
  }
}



// Get event status statistics
export const getEventStatusStats = async (): Promise<IEventStatusStats> => {
  const stats = await Event.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ])

  const result: any = {
    pending: 0,
    approved: 0,
    published: 0,
    completed: 0,
    cancelled: 0,
    archived: 0,
    rejected: 0,
  }

  stats.forEach(s => {
    if (s._id) result[s._id.toLowerCase()] = s.count
  })

  return result as IEventStatusStats
}

// Get organizer dashboard stats
export const getOrganizerDashboardStats = async (organizerId: string): Promise<IOrganizerStats> => {
  const [totalEvents, totalFollowers] = await Promise.all([
    Event.countDocuments({ organizerId }),
    Follow.countDocuments({ followingId: organizerId }),
  ])

  return {
    totalEvents,
    activeEvents: totalEvents,
    eventsCreated: totalEvents,
    totalFollowers,
    totalViews: 0,
    avgEngagement: 0,
    followersGrowth: 0,
    eventGrowth: 0,
    eventsCreatedGrowth: 0,
  }
}

// Get organizer event statistics
export const getOrganizerEventStats = async (
  organizerId: string,
  months: number = 6
): Promise<IEventStats> => {
  return getEventStats(months) // Simplified for organizer
}



// Get organizer event status statistics
export const getOrganizerEventStatusStats = async (organizerId: string): Promise<IEventStatusStats> => {
  return getEventStatusStats() // Simplified
}

// Get organizer app summary
export const getOrganizerAppSummary = async (organizerId: string) => {
  return {}
}

// Get app summary (all stats)
export const getAppSummary = async () => {
  const [dashboard, events, users, status] = await Promise.all([
    getAdminDashboardStats(),
    getEventStats(),
    getUserStats(),
    getEventStatusStats(),
  ])

  return {
    dashboard,
    events,
    users,
    status,
  }
}

// Get individual event statistics
export const getIndividualEventStats = async (
  eventId: string,
  days: number = 7
): Promise<IIndividualEventStats> => {
  const event = await Event.findById(eventId)
  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found')

  return {
    totalViews: event.views || 0,
    capacity: event.capacity || 0,
    address: event.address || '',
    title: event.title,
    startDate: event.startDate ? new Date(event.startDate).toISOString() : '',
    category: event.category,
    dailyStats: [],
  }
}

// Get shared event analytics
export const getEventAnalytics = async (eventId: string): Promise<IEventAnalytics> => {
  const event = await Event.findById(eventId)
  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found')

  return {
    totalViews: event.views || 0,
    totalEngagement: 0,
    dailyStats: [],
  }
}



// Get organizer upcoming events
export const getOrganizerUpcomingEvents = async (organizerId: string): Promise<any> => {
  return Event.find({ organizerId, startDate: { $gte: new Date() } }).limit(5)
}

// Get organizer promotion stats
export const getOrganizerPromotionStats = async (organizerId: string): Promise<IPromotionStats> => {
  return {
    activePromotions: 0,
    totalPromotions: 0,
    totalRedemptions: 0,
  }
}

// Get content moderation stats
export const getContentModerationStats = async (): Promise<IContentModerationStats> => {
  return {
    deleted: 0,
    solved: 0,
    in_progress: 0,
    dismissed: 0,
  }
}

// Get weekly event created stats
export const getWeeklyEventCreatedStats = async (): Promise<IWeeklyEventStats[]> => {
  return []
}

// Get user engagement breakdown
export const getUserEngagementStats = async (): Promise<IUserEngagementStats[]> => {
  return []
}

export const EventStatsServices = {
  getAdminDashboardStats,
  getEventStats,
  getUserStats,

  getEventStatusStats,
  getAppSummary,
  getOrganizerDashboardStats,
  getOrganizerEventStats,

  getOrganizerEventStatusStats,
  getOrganizerAppSummary,
  getIndividualEventStats,
  getEventAnalytics,
  getOrganizerPromotionStats,
  getOrganizerUpcomingEvents,
  getContentModerationStats,
  getWeeklyEventCreatedStats,
  getUserEngagementStats,
}
