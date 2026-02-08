export interface IRecentEvent {
  _id: string
  title: string
  startDate: string
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
  totalCapacity: number
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
  totalViews: number
  avgEngagement: number
  followersGrowth: number
  eventGrowth: number
  eventsCreatedGrowth: number
}

export interface IIndividualEventStats {
  totalViews: number
  capacity: number
  address: string
  title: string
  startDate: string
  category: string
  dailyStats: Array<{
    date: string
    dayName: string
    views: number
  }>
}

export interface IEventAnalytics {
  totalViews: number
  totalEngagement: number
  dailyStats: Array<{
    date: string
    dayName: string
    views: number
    engagement: number
  }>
}

export interface IPromotionStats {
  activePromotions: number
  totalPromotions: number
  totalRedemptions: number
}

export interface IContentModerationStats {
  deleted: number
  solved: number
  in_progress: number
  dismissed: number
}
export interface IWeeklyEventStats {
  day: string
  count: number
}

export interface IUserEngagementStats {
  month: string
  highlyActive: number
  inactive: number
}
