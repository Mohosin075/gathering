import { Event } from '../event/event.model'
import { User } from '../user/user.model'
import { Review } from '../review/review.model'
import { Follow } from '../follow/follow.model'
import {
  IAdminStats,
  IEventStats,
  IUserStats,
  IRevenueStats,
  IEventStatusStats,
  IOrganizerStats,
} from './stats.interface'
import { EVENT_STATUS, EVENT_CATEGORIES } from '../../../enum/event'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'

// Helper function to get month name
const getMonthName = (monthIndex: number): string => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return months[monthIndex]
}

// Helper function to ensure all months are included
const fillMissingMonths = (
  data: Array<{ month: string; count?: number; revenue?: number }>,
  months: number = 6,
  type: 'count' | 'revenue' = 'count',
) => {
  const result = []
  const endDate = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(endDate.getMonth() - i)
    const monthName = getMonthName(date.getMonth())

    const existingData = data.find(item => item.month === monthName)

    if (existingData) {
      result.push(existingData)
    } else {
      result.push({ month: monthName, [type]: 0 })
    }
  }

  return result
}

// Get admin dashboard stats (like the image)
export const getAdminDashboardStats = async (): Promise<IAdminStats> => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  )

  // Get all stats in parallel
  const [
    totalUsers,
    activeEvents,
    eventsCreatedThisMonth,
    pendingReviews,
    lastMonthUsers,
    lastMonthActiveEvents,
    lastMonthEventsCreated,
    totalEvents,
  ] = await Promise.all([
    // Total Users
    User.countDocuments(),

    // Active Events (events happening now or in future)
    Event.countDocuments({
      startDate: { $gte: new Date().toISOString().split('T')[0] },
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.PUBLISHED] },
    }),

    // Events Created This Month
    Event.countDocuments({
      createdAt: { $gte: startOfCurrentMonth },
    }),

    // Pending Reviews (assuming Review model exists)
    Review.countDocuments({ status: 'pending' }),

    // Last month stats for growth calculation
    User.countDocuments({ createdAt: { $lt: startOfCurrentMonth } }),
    Event.countDocuments({
      startDate: {
        $gte: startOfLastMonth.toISOString().split('T')[0],
        $lt: startOfCurrentMonth.toISOString().split('T')[0],
      },
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.PUBLISHED] },
    }),
    Event.countDocuments({
      createdAt: {
        $gte: startOfLastMonth,
        $lt: startOfCurrentMonth,
      },
    }),

    // Total Events for events created percentage
    Event.countDocuments(),
  ])

  // Calculate growth percentages
  const userGrowth =
    lastMonthUsers > 0
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
      : totalUsers > 0
        ? 100
        : 0

  const eventGrowth =
    lastMonthActiveEvents > 0
      ? ((activeEvents - lastMonthActiveEvents) / lastMonthActiveEvents) * 100
      : activeEvents > 0
        ? 100
        : 0

  const eventsCreatedGrowth =
    lastMonthEventsCreated > 0
      ? ((eventsCreatedThisMonth - lastMonthEventsCreated) /
          lastMonthEventsCreated) *
        100
      : eventsCreatedThisMonth > 0
        ? 100
        : 0

  // Calculate events created percentage
  const eventsCreatedPercentage =
    totalEvents > 0 ? (eventsCreatedThisMonth / totalEvents) * 100 : 0

  return {
    totalUsers,
    activeEvents,
    eventsCreated: eventsCreatedThisMonth,
    pendingReviews,
    userGrowth: Math.round(userGrowth * 10) / 10, // Round to 1 decimal
    eventGrowth: Math.round(eventGrowth * 10) / 10,
    eventsCreatedGrowth: Math.round(eventsCreatedGrowth * 10) / 10,
  }
}

// Get event statistics
export const getEventStats = async (
  months: number = 6,
): Promise<IEventStats> => {
  const now = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  // Get current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split('T')[0]

  // Get all stats in parallel
  const [
    totalEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    revenueData,
    ticketData,
    eventTrend,
    categoryDistribution,
  ] = await Promise.all([
    // Total Events
    Event.countDocuments(),

    // Upcoming Events
    Event.countDocuments({
      startDate: { $gte: currentDate },
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.PUBLISHED] },
    }),

    // Completed Events
    Event.countDocuments({
      startDate: { $lt: currentDate },
      status: EVENT_STATUS.COMPLETED,
    }),

    // Cancelled Events
    Event.countDocuments({ status: EVENT_STATUS.CANCELLED }),

    // Revenue Data
    Event.aggregate([
      {
        $match: {
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
          totalTicketsSold: { $sum: '$ticketsSold' },
          totalCapacity: { $sum: '$capacity' },
        },
      },
    ]),

    // Average Ticket Price
    Event.aggregate([
      {
        $match: {
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          ticketPrice: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          averageTicketPrice: { $avg: '$ticketPrice' },
        },
      },
    ]),

    // Event Trend (last 6 months)
    Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInYear: [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
              },
              in: {
                $arrayElemAt: [
                  '$$monthsInYear',
                  { $subtract: ['$_id.month', 1] },
                ],
              },
            },
          },
          count: 1,
        },
      },
    ]),

    // Category Distribution
    Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),
  ])

  const revenue = revenueData[0] || {
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalCapacity: 0,
  }
  const avgTicketPrice = ticketData[0]?.averageTicketPrice || 0
  const occupancyRate =
    revenue.totalCapacity > 0
      ? (revenue.totalTicketsSold / revenue.totalCapacity) * 100
      : 0

  // Fill missing months
  const filledEventTrend = fillMissingMonths(
    eventTrend.map(item => ({ month: item.month, count: item.count })),
    months,
    'count',
  ) as Array<{ month: string; count: number }>

  return {
    totalEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    totalRevenue: Math.round(revenue.totalRevenue * 100) / 100,
    averageTicketPrice: Math.round(avgTicketPrice * 100) / 100,
    ticketsSold: revenue.totalTicketsSold,
    totalCapacity: revenue.totalCapacity,
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    eventTrend: filledEventTrend,
    categoryDistribution,
  }
}

// Get user statistics
export const getUserStats = async (months: number = 6): Promise<IUserStats> => {
  const now = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Get all stats in parallel
  const [
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    lastMonthUsers,
    userDistributionByRole,
    userDistributionByStatus,
    monthlySignups,
  ] = await Promise.all([
    // Total Users
    User.countDocuments(),

    // Active Users (users who have logged in recently or have active events)
    User.countDocuments({
      status: USER_STATUS.ACTIVE,
      updatedAt: { $gte: startOfLastMonth },
    }),

    // New Users This Month
    User.countDocuments({
      createdAt: { $gte: startOfCurrentMonth },
    }),

    // Last month users for growth calculation
    User.countDocuments({ createdAt: { $lt: startOfCurrentMonth } }),

    // User Distribution by Role
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),

    // User Distribution by Status
    User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),

    // Monthly Signups
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInYear: [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
              },
              in: {
                $arrayElemAt: [
                  '$$monthsInYear',
                  { $subtract: ['$_id.month', 1] },
                ],
              },
            },
          },
          count: 1,
        },
      },
    ]),
  ])

  // Calculate growth
  const userGrowth =
    lastMonthUsers > 0
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
      : totalUsers > 0
        ? 100
        : 0

  // Fill missing months
  const filledMonthlySignups = fillMissingMonths(
    monthlySignups.map(item => ({ month: item.month, count: item.count })),
    months,
    'count',
  ) as Array<{ month: string; count: number }>

  return {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    userGrowth: Math.round(userGrowth * 10) / 10,
    userDistribution: {
      byRole: userDistributionByRole,
      byStatus: userDistributionByStatus,
    },
    monthlySignups: filledMonthlySignups,
  }
}

// Get revenue statistics
export const getRevenueStats = async (
  months: number = 6,
): Promise<IRevenueStats> => {
  const now = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Get all stats in parallel
  const [
    revenueData,
    lastMonthRevenueData,
    monthlyRevenue,
    revenueByCategory,
    ticketData,
  ] = await Promise.all([
    // Current Revenue
    Event.aggregate([
      {
        $match: {
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
          ticketsSold: { $sum: '$ticketsSold' },
        },
      },
    ]),

    // Last Month Revenue for growth calculation
    Event.aggregate([
      {
        $match: {
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          updatedAt: {
            $gte: startOfLastMonth,
            $lt: startOfCurrentMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
        },
      },
    ]),

    // Monthly Revenue Trend
    Event.aggregate([
      {
        $match: {
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          revenue: { $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] } },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInYear: [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
              },
              in: {
                $arrayElemAt: [
                  '$$monthsInYear',
                  { $subtract: ['$_id.month', 1] },
                ],
              },
            },
          },
          revenue: { $round: ['$revenue', 2] },
        },
      },
    ]),

    // Revenue by Category
    Event.aggregate([
      {
        $match: {
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$category',
          revenue: { $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] } },
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $project: {
          category: '$_id',
          revenue: { $round: ['$revenue', 2] },
          _id: 0,
        },
      },
    ]),

    // Average Ticket Price
    Event.aggregate([
      {
        $match: {
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          ticketPrice: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          averageTicketPrice: { $avg: '$ticketPrice' },
        },
      },
    ]),
  ])

  const currentRevenue = revenueData[0] || { totalRevenue: 0, ticketsSold: 0 }
  const lastMonthRevenue = lastMonthRevenueData[0]?.totalRevenue || 0
  const averageTicketPrice = ticketData[0]?.averageTicketPrice || 0

  // Calculate revenue growth
  const revenueGrowth =
    lastMonthRevenue > 0
      ? ((currentRevenue.totalRevenue - lastMonthRevenue) / lastMonthRevenue) *
        100
      : currentRevenue.totalRevenue > 0
        ? 100
        : 0

  // Fill missing months
  const filledMonthlyRevenue = fillMissingMonths(
    monthlyRevenue.map(item => ({ month: item.month, revenue: item.revenue })),
    months,
    'revenue',
  ) as Array<{ month: string; revenue: number }>

  return {
    totalRevenue: Math.round(currentRevenue.totalRevenue * 100) / 100,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    monthlyRevenue: filledMonthlyRevenue,
    revenueByCategory,
    averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
    ticketsSold: currentRevenue.ticketsSold,
  }
}

// Get event status statistics
export const getEventStatusStats = async (): Promise<IEventStatusStats> => {
  const result = await Event.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ])

  // Convert array to object with default values
  const statusStats: IEventStatusStats = {
    pending: 0,
    approved: 0,
    published: 0,
    completed: 0,
    cancelled: 0,
    archived: 0,
    rejected: 0,
  }

  result.forEach(item => {
    statusStats[item._id as keyof IEventStatusStats] = item.count
  })

  return statusStats
}

// Get organizer dashboard stats
export const getOrganizerDashboardStats = async (
  organizerId: string,
): Promise<IOrganizerStats> => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Get all stats in parallel
  const [
    totalEvents,
    activeEvents,
    eventsCreatedThisMonth,
    totalFollowers,
    currentRevenue,
    lastMonthActiveEvents,
    lastMonthEventsCreated,
    lastMonthFollowers,
    lastMonthRevenue,
  ] = await Promise.all([
    // Total Events
    Event.countDocuments({ organizerId }),

    // Active Events
    Event.countDocuments({
      organizerId,
      startDate: { $gte: new Date().toISOString().split('T')[0] },
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.PUBLISHED] },
    }),

    // Events Created This Month
    Event.countDocuments({
      organizerId,
      createdAt: { $gte: startOfCurrentMonth },
    }),

    // Total Followers
    Follow.countDocuments({ following: organizerId }),

    // Total Revenue (Current)
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId), // Ensure ObjectId match if needed, but mongoose auto-casts usually
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
        },
      },
    ]),

    // Last Month Stats
    Event.countDocuments({
      organizerId,
      startDate: {
        $gte: startOfLastMonth.toISOString().split('T')[0],
        $lt: startOfCurrentMonth.toISOString().split('T')[0],
      },
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.PUBLISHED] },
    }),
    Event.countDocuments({
      organizerId,
      createdAt: {
        $gte: startOfLastMonth,
        $lt: startOfCurrentMonth,
      },
    }),
    Follow.countDocuments({
      following: organizerId,
      createdAt: { $lt: startOfCurrentMonth },
    }),
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          updatedAt: {
            $gte: startOfLastMonth,
            $lt: startOfCurrentMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
        },
      },
    ]),
  ])

  const revenue = currentRevenue[0]?.totalRevenue || 0
  const lastRevenue = lastMonthRevenue[0]?.totalRevenue || 0

  // Calculate growth percentages
  const eventGrowth =
    lastMonthActiveEvents > 0
      ? ((activeEvents - lastMonthActiveEvents) / lastMonthActiveEvents) * 100
      : activeEvents > 0
        ? 100
        : 0

  const eventsCreatedGrowth =
    lastMonthEventsCreated > 0
      ? ((eventsCreatedThisMonth - lastMonthEventsCreated) /
          lastMonthEventsCreated) *
        100
      : eventsCreatedThisMonth > 0
        ? 100
        : 0

  const followersGrowth =
    lastMonthFollowers > 0
      ? ((totalFollowers - lastMonthFollowers) / lastMonthFollowers) * 100
      : totalFollowers > 0
        ? 100
        : 0

  const revenueGrowth =
    lastRevenue > 0
      ? ((revenue - lastRevenue) / lastRevenue) * 100
      : revenue > 0
        ? 100
        : 0

  return {
    totalEvents,
    activeEvents,
    eventsCreated: eventsCreatedThisMonth,
    totalFollowers,
    totalRevenue: Math.round(revenue * 100) / 100,
    eventGrowth: Math.round(eventGrowth * 10) / 10,
    eventsCreatedGrowth: Math.round(eventsCreatedGrowth * 10) / 10,
    followersGrowth: Math.round(followersGrowth * 10) / 10,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
  }
}

// Get organizer event statistics
export const getOrganizerEventStats = async (
  organizerId: string,
  months: number = 6,
): Promise<IEventStats> => {
  const now = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const currentDate = new Date().toISOString().split('T')[0]

  const [
    totalEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    revenueData,
    ticketData,
    eventTrend,
    categoryDistribution,
  ] = await Promise.all([
    Event.countDocuments({ organizerId }),
    Event.countDocuments({
      organizerId,
      startDate: { $gte: currentDate },
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.PUBLISHED] },
    }),
    Event.countDocuments({
      organizerId,
      startDate: { $lt: currentDate },
      status: EVENT_STATUS.COMPLETED,
    }),
    Event.countDocuments({ organizerId, status: EVENT_STATUS.CANCELLED }),
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
          totalTicketsSold: { $sum: '$ticketsSold' },
          totalCapacity: { $sum: '$capacity' },
        },
      },
    ]),
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          ticketPrice: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          averageTicketPrice: { $avg: '$ticketPrice' },
        },
      },
    ]),
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInYear: [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
              },
              in: {
                $arrayElemAt: [
                  '$$monthsInYear',
                  { $subtract: ['$_id.month', 1] },
                ],
              },
            },
          },
          count: 1,
        },
      },
    ]),
    Event.aggregate([
      { $match: { organizerId: new Object(organizerId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),
  ])

  const revenue = revenueData[0] || {
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalCapacity: 0,
  }
  const avgTicketPrice = ticketData[0]?.averageTicketPrice || 0
  const occupancyRate =
    revenue.totalCapacity > 0
      ? (revenue.totalTicketsSold / revenue.totalCapacity) * 100
      : 0

  const filledEventTrend = fillMissingMonths(
    eventTrend.map(item => ({ month: item.month, count: item.count })),
    months,
    'count',
  ) as Array<{ month: string; count: number }>

  return {
    totalEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    totalRevenue: Math.round(revenue.totalRevenue * 100) / 100,
    averageTicketPrice: Math.round(avgTicketPrice * 100) / 100,
    ticketsSold: revenue.totalTicketsSold,
    totalCapacity: revenue.totalCapacity,
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    eventTrend: filledEventTrend,
    categoryDistribution,
  }
}

// Get organizer revenue statistics
export const getOrganizerRevenueStats = async (
  organizerId: string,
  months: number = 6,
): Promise<IRevenueStats> => {
  const now = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    revenueData,
    lastMonthRevenueData,
    monthlyRevenue,
    revenueByCategory,
    ticketData,
  ] = await Promise.all([
    // Current Revenue
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
          ticketsSold: { $sum: '$ticketsSold' },
        },
      },
    ]),

    // Last Month Revenue
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          updatedAt: {
            $gte: startOfLastMonth,
            $lt: startOfCurrentMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] },
          },
        },
      },
    ]),

    // Monthly Revenue Trend
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          revenue: { $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInYear: [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
              },
              in: {
                $arrayElemAt: [
                  '$$monthsInYear',
                  { $subtract: ['$_id.month', 1] },
                ],
              },
            },
          },
          revenue: { $round: ['$revenue', 2] },
        },
      },
    ]),

    // Revenue by Category
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$category',
          revenue: { $sum: { $multiply: ['$ticketPrice', '$ticketsSold'] } },
        },
      },
      { $sort: { revenue: -1 } },
      {
        $project: {
          category: '$_id',
          revenue: { $round: ['$revenue', 2] },
          _id: 0,
        },
      },
    ]),

    // Average Ticket Price
    Event.aggregate([
      {
        $match: {
          organizerId: new Object(organizerId),
          status: {
            $in: [
              EVENT_STATUS.COMPLETED,
              EVENT_STATUS.PUBLISHED,
              EVENT_STATUS.APPROVED,
            ],
          },
          ticketPrice: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          averageTicketPrice: { $avg: '$ticketPrice' },
        },
      },
    ]),
  ])

  const currentRevenue = revenueData[0] || { totalRevenue: 0, ticketsSold: 0 }
  const lastMonthRevenue = lastMonthRevenueData[0]?.totalRevenue || 0
  const averageTicketPrice = ticketData[0]?.averageTicketPrice || 0

  const revenueGrowth =
    lastMonthRevenue > 0
      ? ((currentRevenue.totalRevenue - lastMonthRevenue) / lastMonthRevenue) *
        100
      : currentRevenue.totalRevenue > 0
        ? 100
        : 0

  const filledMonthlyRevenue = fillMissingMonths(
    monthlyRevenue.map(item => ({ month: item.month, revenue: item.revenue })),
    months,
    'revenue',
  ) as Array<{ month: string; revenue: number }>

  return {
    totalRevenue: Math.round(currentRevenue.totalRevenue * 100) / 100,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    monthlyRevenue: filledMonthlyRevenue,
    revenueByCategory,
    averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
    ticketsSold: currentRevenue.ticketsSold,
  }
}

// Get organizer event status statistics
export const getOrganizerEventStatusStats = async (
  organizerId: string,
): Promise<IEventStatusStats> => {
  const result = await Event.aggregate([
    {
      $match: { organizerId: new Object(organizerId) },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ])

  const statusStats: IEventStatusStats = {
    pending: 0,
    approved: 0,
    published: 0,
    completed: 0,
    cancelled: 0,
    archived: 0,
    rejected: 0,
  }

  result.forEach(item => {
    statusStats[item._id as keyof IEventStatusStats] = item.count
  })

  return statusStats
}

// Get organizer app summary
export const getOrganizerAppSummary = async (organizerId: string) => {
  const [dashboard, events, revenue, status] = await Promise.all([
    getOrganizerDashboardStats(organizerId),
    getOrganizerEventStats(organizerId),
    getOrganizerRevenueStats(organizerId),
    getOrganizerEventStatusStats(organizerId),
  ])

  return {
    dashboard,
    events,
    revenue,
    status,
  }
}

// Get app summary (all stats)
export const getAppSummary = async () => {
  const [dashboard, events, users, revenue, status] = await Promise.all([
    getAdminDashboardStats(),
    getEventStats(),
    getUserStats(),
    getRevenueStats(),
    getEventStatusStats(),
  ])

  return {
    dashboard,
    events,
    users,
    revenue,
    status,
  }
}

export const EventStatsServices = {
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
}
