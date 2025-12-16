export interface IAdminStats {
  totalUsers: number
  activeEvents: number
  eventsCreated: number
  pendingReviews: number
  userGrowth: number
  eventGrowth: number
  eventsCreatedGrowth: number
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
