"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStatsServices = exports.getUserEngagementStats = exports.getWeeklyEventCreatedStats = exports.getContentModerationStats = exports.getOrganizerPromotionStats = exports.getOrganizerUpcomingEvents = exports.getEventAnalytics = exports.getIndividualEventStats = exports.getAppSummary = exports.getOrganizerAppSummary = exports.getOrganizerEventStatusStats = exports.getOrganizerEventStats = exports.getOrganizerDashboardStats = exports.getEventStatusStats = exports.getUserStats = exports.getEventStats = exports.getAdminDashboardStats = void 0;
const event_model_1 = require("../event/event.model");
const user_model_1 = require("../user/user.model");
const review_model_1 = require("../review/review.model");
const follow_model_1 = require("../follow/follow.model");
const event_1 = require("../../../enum/event");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
// Helper function to get month name
const getMonthName = (monthIndex) => {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return months[monthIndex];
};
// Helper function to get day name
const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
};
// Helper function to ensure all months are included
const fillMissingMonths = (data, monthsCount = 6, type = 'count') => {
    const result = [];
    const now = new Date();
    for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = getMonthName(d.getMonth());
        const existing = data.find(item => item.month === monthName);
        if (existing) {
            result.push(existing);
        }
        else {
            result.push({
                month: monthName,
                [type]: 0,
            });
        }
    }
    return result;
};
// Get admin dashboard stats
const getAdminDashboardStats = async () => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [totalUsers, activeEvents, eventsCreated, pendingReviews, lastMonthUsers, lastMonthEvents,] = await Promise.all([
        user_model_1.User.countDocuments(),
        event_model_1.Event.countDocuments({ status: event_1.EVENT_STATUS.PUBLISHED }),
        event_model_1.Event.countDocuments(),
        review_model_1.Review.countDocuments({ isApproved: false }),
        user_model_1.User.countDocuments({ createdAt: { $lt: startOfCurrentMonth, $gte: startOfLastMonth } }),
        event_model_1.Event.countDocuments({ createdAt: { $lt: startOfCurrentMonth, $gte: startOfLastMonth } }),
    ]);
    const userGrowth = lastMonthUsers > 0 ? (totalUsers / lastMonthUsers) * 100 : 0;
    const eventGrowth = lastMonthEvents > 0 ? (activeEvents / lastMonthEvents) * 100 : 0;
    return {
        totalUsers,
        activeEvents,
        eventsCreated,
        pendingReviews,
        userGrowth,
        eventGrowth,
        eventsCreatedGrowth: 0,
        recentActivities: [],
    };
};
exports.getAdminDashboardStats = getAdminDashboardStats;
// Get event statistics
const getEventStats = async (months = 6) => {
    var _a;
    const [totalEvents, upcomingEvents, completedEvents, cancelledEvents, capacityData,] = await Promise.all([
        event_model_1.Event.countDocuments(),
        event_model_1.Event.countDocuments({ status: { $in: [event_1.EVENT_STATUS.PUBLISHED, event_1.EVENT_STATUS.APPROVED] } }),
        event_model_1.Event.countDocuments({ status: event_1.EVENT_STATUS.COMPLETED }),
        event_model_1.Event.countDocuments({ status: event_1.EVENT_STATUS.CANCELLED }),
        event_model_1.Event.aggregate([
            { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } }
        ]),
    ]);
    return {
        totalEvents,
        upcomingEvents,
        completedEvents,
        cancelledEvents,
        totalCapacity: ((_a = capacityData[0]) === null || _a === void 0 ? void 0 : _a.totalCapacity) || 0,
        eventTrend: [],
        categoryDistribution: [],
    };
};
exports.getEventStats = getEventStats;
// Get user statistics
const getUserStats = async (months = 6) => {
    const totalUsers = await user_model_1.User.countDocuments();
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
    };
};
exports.getUserStats = getUserStats;
// Get event status statistics
const getEventStatusStats = async () => {
    const stats = await event_model_1.Event.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const result = {
        pending: 0,
        approved: 0,
        published: 0,
        completed: 0,
        cancelled: 0,
        archived: 0,
        rejected: 0,
    };
    stats.forEach(s => {
        if (s._id)
            result[s._id.toLowerCase()] = s.count;
    });
    return result;
};
exports.getEventStatusStats = getEventStatusStats;
// Get organizer dashboard stats
const getOrganizerDashboardStats = async (organizerId) => {
    const [totalEvents, totalFollowers] = await Promise.all([
        event_model_1.Event.countDocuments({ organizerId }),
        follow_model_1.Follow.countDocuments({ followingId: organizerId }),
    ]);
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
    };
};
exports.getOrganizerDashboardStats = getOrganizerDashboardStats;
// Get organizer event statistics
const getOrganizerEventStats = async (organizerId, months = 6) => {
    return (0, exports.getEventStats)(months); // Simplified for organizer
};
exports.getOrganizerEventStats = getOrganizerEventStats;
// Get organizer event status statistics
const getOrganizerEventStatusStats = async (organizerId) => {
    return (0, exports.getEventStatusStats)(); // Simplified
};
exports.getOrganizerEventStatusStats = getOrganizerEventStatusStats;
// Get organizer app summary
const getOrganizerAppSummary = async (organizerId) => {
    return {};
};
exports.getOrganizerAppSummary = getOrganizerAppSummary;
// Get app summary (all stats)
const getAppSummary = async () => {
    const [dashboard, events, users, status] = await Promise.all([
        (0, exports.getAdminDashboardStats)(),
        (0, exports.getEventStats)(),
        (0, exports.getUserStats)(),
        (0, exports.getEventStatusStats)(),
    ]);
    return {
        dashboard,
        events,
        users,
        status,
    };
};
exports.getAppSummary = getAppSummary;
// Get individual event statistics
const getIndividualEventStats = async (eventId, days = 7) => {
    const event = await event_model_1.Event.findById(eventId);
    if (!event)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    return {
        totalViews: event.views || 0,
        capacity: event.capacity || 0,
        address: event.address || '',
        title: event.title,
        startDate: event.startDate ? new Date(event.startDate).toISOString() : '',
        category: event.category,
        dailyStats: [],
    };
};
exports.getIndividualEventStats = getIndividualEventStats;
// Get shared event analytics
const getEventAnalytics = async (eventId) => {
    const event = await event_model_1.Event.findById(eventId);
    if (!event)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    return {
        totalViews: event.views || 0,
        totalEngagement: 0,
        dailyStats: [],
    };
};
exports.getEventAnalytics = getEventAnalytics;
// Get organizer upcoming events
const getOrganizerUpcomingEvents = async (organizerId) => {
    return event_model_1.Event.find({ organizerId, startDate: { $gte: new Date() } }).limit(5);
};
exports.getOrganizerUpcomingEvents = getOrganizerUpcomingEvents;
// Get organizer promotion stats
const getOrganizerPromotionStats = async (organizerId) => {
    return {
        activePromotions: 0,
        totalPromotions: 0,
        totalRedemptions: 0,
    };
};
exports.getOrganizerPromotionStats = getOrganizerPromotionStats;
// Get content moderation stats
const getContentModerationStats = async () => {
    return {
        deleted: 0,
        solved: 0,
        in_progress: 0,
        dismissed: 0,
    };
};
exports.getContentModerationStats = getContentModerationStats;
// Get weekly event created stats
const getWeeklyEventCreatedStats = async () => {
    return [];
};
exports.getWeeklyEventCreatedStats = getWeeklyEventCreatedStats;
// Get user engagement breakdown
const getUserEngagementStats = async () => {
    return [];
};
exports.getUserEngagementStats = getUserEngagementStats;
exports.EventStatsServices = {
    getAdminDashboardStats: exports.getAdminDashboardStats,
    getEventStats: exports.getEventStats,
    getUserStats: exports.getUserStats,
    getEventStatusStats: exports.getEventStatusStats,
    getAppSummary: exports.getAppSummary,
    getOrganizerDashboardStats: exports.getOrganizerDashboardStats,
    getOrganizerEventStats: exports.getOrganizerEventStats,
    getOrganizerEventStatusStats: exports.getOrganizerEventStatusStats,
    getOrganizerAppSummary: exports.getOrganizerAppSummary,
    getIndividualEventStats: exports.getIndividualEventStats,
    getEventAnalytics: exports.getEventAnalytics,
    getOrganizerPromotionStats: exports.getOrganizerPromotionStats,
    getOrganizerUpcomingEvents: exports.getOrganizerUpcomingEvents,
    getContentModerationStats: exports.getContentModerationStats,
    getWeeklyEventCreatedStats: exports.getWeeklyEventCreatedStats,
    getUserEngagementStats: exports.getUserEngagementStats,
};
