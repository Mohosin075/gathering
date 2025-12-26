export interface IRecentEvent {
  _id: string
  title: string
  startDate: string
  ticketsSold: number
  status: string
}

export interface IAdminStats {
  totalUsers: number
  activeEvents: number
  eventsCreated: number
  pendingReviews: number
  userGrowth: number
  eventGrowth: number
  eventsCreatedGrowth: number
  recentActivities: any[]
}

export interface IEventStats {
  totalEvents: number
  upcomingEvents: number
  completedEvents: number
  cancelledEvents: number
  totalRevenue: number
  averageTicketPrice: number
  ticketsSold: number
  totalCapacity: number
  occupancyRate: number
  eventTrend: Array<{ month: string; count: number }>
  categoryDistribution: Array<{ category: string; count: number }>
}

export interface IUserStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  userGrowth: number
  userDistribution: {
    byRole: Array<{ role: string; count: number }>
    byStatus: Array<{ status: string; count: number }>
  }
  monthlySignups: Array<{ month: string; count: number }>
}

export interface IRevenueStats {
  totalRevenue: number
  revenueGrowth: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  revenueByCategory: Array<{ category: string; revenue: number }>
  averageTicketPrice: number
  ticketsSold: number
}

export interface IEventStatusStats {
  pending: number
  approved: number
  published: number
  completed: number
  cancelled: number
  archived: number
  rejected: number
}

export interface IOrganizerStats {
  totalEvents: number
  activeEvents: number
  eventsCreated: number
  totalFollowers: number
  totalRevenue: number
  totalViews: number
  avgEngagement: number
  followersGrowth: number
  eventGrowth: number
  eventsCreatedGrowth: number
  revenueGrowth: number
}

export interface IIndividualEventStats {
  totalViews: number
  ticketsSold: number
  capacity: number
  totalRevenue: number
  averageTicketPrice: number
  conversionRate: number
  dailyStats: Array<{
    date: string
    views: number
    sales: number
    revenue: number
  }>
}

export interface IEventAnalytics {
  totalViews: number
  totalEngagement: number
  totalSales: number
  totalRevenue: number
  dailyStats: Array<{
    date: string
    views: number
    engagement: number
    sales: number
    revenue: number
  }>
}
