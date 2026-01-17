"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStatsServices = exports.getUserEngagementStats = exports.getWeeklyEventCreatedStats = exports.getContentModerationStats = exports.getOrganizerPromotionStats = exports.getEventAnalytics = exports.getIndividualEventStats = exports.getAppSummary = exports.getOrganizerAppSummary = exports.getOrganizerEventStatusStats = exports.getOrganizerRevenueStats = exports.getOrganizerEventStats = exports.getOrganizerDashboardStats = exports.getEventStatusStats = exports.getRevenueStats = exports.getUserStats = exports.getEventStats = exports.getAdminDashboardStats = void 0;
const event_model_1 = require("../event/event.model");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../user/user.model");
const review_model_1 = require("../review/review.model");
const follow_model_1 = require("../follow/follow.model");
const savedEvent_model_1 = require("../savedEvent/savedEvent.model");
const promotion_model_1 = require("../promotion/promotion.model");
const support_model_1 = require("../support/support.model");
const activity_model_1 = require("../activity/activity.model");
const event_1 = require("../../../enum/event");
const user_1 = require("../../../enum/user");
const notification_service_1 = require("../notification/notification.service");
// Helper function to get month name
const getMonthName = (monthIndex) => {
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
    ];
    return months[monthIndex];
};
// Helper function to ensure all months are included
const fillMissingMonths = (data, months = 6, type = 'count') => {
    const result = [];
    const endDate = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(endDate.getMonth() - i);
        const monthName = getMonthName(date.getMonth());
        const existingData = data.find(item => item.month === monthName);
        if (existingData) {
            result.push(existingData);
        }
        else {
            result.push({ month: monthName, [type]: 0 });
        }
    }
    return result;
};
// Get admin dashboard stats (like the image)
const getAdminDashboardStats = async () => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    // Get all stats in parallel
    const [totalUsers, activeEvents, eventsCreatedThisMonth, pendingReviews, lastMonthUsers, lastMonthActiveEvents, lastMonthEventsCreated, totalEvents, recentActivities,] = await Promise.all([
        // Total Users
        user_model_1.User.countDocuments(),
        // Active Events (events happening now or in future)
        event_model_1.Event.countDocuments({
            startDate: { $gte: new Date().toISOString().split('T')[0] },
            status: { $in: [event_1.EVENT_STATUS.APPROVED, event_1.EVENT_STATUS.PUBLISHED] },
        }),
        // Events Created This Month
        event_model_1.Event.countDocuments({
            createdAt: { $gte: startOfCurrentMonth },
        }),
        // Pending Reviews (assuming Review model exists)
        review_model_1.Review.countDocuments({ status: 'pending' }),
        // Last month stats for growth calculation
        user_model_1.User.countDocuments({ createdAt: { $lt: startOfCurrentMonth } }),
        event_model_1.Event.countDocuments({
            startDate: {
                $gte: startOfLastMonth.toISOString().split('T')[0],
                $lt: startOfCurrentMonth.toISOString().split('T')[0],
            },
            status: { $in: [event_1.EVENT_STATUS.APPROVED, event_1.EVENT_STATUS.PUBLISHED] },
        }),
        event_model_1.Event.countDocuments({
            createdAt: {
                $gte: startOfLastMonth,
                $lt: startOfCurrentMonth,
            },
        }),
        // Total Events for events created percentage
        // Total Events for events created percentage
        event_model_1.Event.countDocuments(),
        // Recent Activity (Notifications with analytics)
        notification_service_1.NotificationServices.getAllNotifications({ role: user_1.USER_ROLES.SUPER_ADMIN }, // Admin view
        {}, { limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
    ]);
    // Calculate growth percentages
    const userGrowth = lastMonthUsers > 0
        ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
        : totalUsers > 0
            ? 100
            : 0;
    const eventGrowth = lastMonthActiveEvents > 0
        ? ((activeEvents - lastMonthActiveEvents) / lastMonthActiveEvents) * 100
        : activeEvents > 0
            ? 100
            : 0;
    const eventsCreatedGrowth = lastMonthEventsCreated > 0
        ? ((eventsCreatedThisMonth - lastMonthEventsCreated) /
            lastMonthEventsCreated) *
            100
        : eventsCreatedThisMonth > 0
            ? 100
            : 0;
    // Calculate events created percentage
    const eventsCreatedPercentage = totalEvents > 0 ? (eventsCreatedThisMonth / totalEvents) * 100 : 0;
    return {
        totalUsers,
        activeEvents,
        eventsCreated: eventsCreatedThisMonth,
        pendingReviews,
        userGrowth: Math.round(userGrowth * 10) / 10, // Round to 1 decimal
        eventGrowth: Math.round(eventGrowth * 10) / 10,
        eventsCreatedGrowth: Math.round(eventsCreatedGrowth * 10) / 10,
        recentActivities: recentActivities.data.map((notification) => {
            var _a, _b;
            return ({
                ...notification,
                openRate: ((_a = notification.analytics) === null || _a === void 0 ? void 0 : _a.openRate) || 0,
                engagement: ((_b = notification.analytics) === null || _b === void 0 ? void 0 : _b.engagement) || 0,
            });
        }),
    };
};
exports.getAdminDashboardStats = getAdminDashboardStats;
// Get event statistics
const getEventStats = async (months = 6) => {
    var _a;
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    // Get all stats in parallel
    const [totalEvents, upcomingEvents, completedEvents, cancelledEvents, revenueData, ticketData, eventTrend, categoryDistribution,] = await Promise.all([
        // Total Events
        event_model_1.Event.countDocuments(),
        // Upcoming Events
        event_model_1.Event.countDocuments({
            startDate: { $gte: currentDate },
            status: { $in: [event_1.EVENT_STATUS.APPROVED, event_1.EVENT_STATUS.PUBLISHED] },
        }),
        // Completed Events
        event_model_1.Event.countDocuments({
            startDate: { $lt: currentDate },
            status: event_1.EVENT_STATUS.COMPLETED,
        }),
        // Cancelled Events
        event_model_1.Event.countDocuments({ status: event_1.EVENT_STATUS.CANCELLED }),
        // Revenue Data
        event_model_1.Event.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
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
        event_model_1.Event.aggregate([
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
    ]);
    const revenue = revenueData[0] || {
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalCapacity: 0,
    };
    const avgTicketPrice = ((_a = ticketData[0]) === null || _a === void 0 ? void 0 : _a.averageTicketPrice) || 0;
    const occupancyRate = revenue.totalCapacity > 0
        ? (revenue.totalTicketsSold / revenue.totalCapacity) * 100
        : 0;
    // Fill missing months
    const filledEventTrend = fillMissingMonths(eventTrend.map(item => ({ month: item.month, count: item.count })), months, 'count');
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
    };
};
exports.getEventStats = getEventStats;
// Get user statistics
const getUserStats = async (months = 6) => {
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Get all stats in parallel
    const [totalUsers, activeUsers, newUsersThisMonth, lastMonthUsers, userDistributionByRole, userDistributionByStatus, monthlySignups,] = await Promise.all([
        // Total Users
        user_model_1.User.countDocuments(),
        // Active Users (users who have logged in recently or have active events)
        user_model_1.User.countDocuments({
            status: user_1.USER_STATUS.ACTIVE,
            updatedAt: { $gte: startOfLastMonth },
        }),
        // New Users This Month
        user_model_1.User.countDocuments({
            createdAt: { $gte: startOfCurrentMonth },
        }),
        // Last month users for growth calculation
        user_model_1.User.countDocuments({ createdAt: { $lt: startOfCurrentMonth } }),
        // User Distribution by Role
        user_model_1.User.aggregate([
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
        user_model_1.User.aggregate([
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
        user_model_1.User.aggregate([
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
    ]);
    // Calculate growth
    const userGrowth = lastMonthUsers > 0
        ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
        : totalUsers > 0
            ? 100
            : 0;
    // Fill missing months
    const filledMonthlySignups = fillMissingMonths(monthlySignups.map(item => ({ month: item.month, count: item.count })), months, 'count');
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
    };
};
exports.getUserStats = getUserStats;
// Get revenue statistics
const getRevenueStats = async (months = 6) => {
    var _a, _b;
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Get all stats in parallel
    const [revenueData, lastMonthRevenueData, monthlyRevenue, revenueByCategory, ticketData,] = await Promise.all([
        // Current Revenue
        event_model_1.Event.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
    ]);
    const currentRevenue = revenueData[0] || { totalRevenue: 0, ticketsSold: 0 };
    const lastMonthRevenue = ((_a = lastMonthRevenueData[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    const averageTicketPrice = ((_b = ticketData[0]) === null || _b === void 0 ? void 0 : _b.averageTicketPrice) || 0;
    // Calculate revenue growth
    const revenueGrowth = lastMonthRevenue > 0
        ? ((currentRevenue.totalRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
        : currentRevenue.totalRevenue > 0
            ? 100
            : 0;
    // Fill missing months
    const filledMonthlyRevenue = fillMissingMonths(monthlyRevenue.map(item => ({ month: item.month, revenue: item.revenue })), months, 'revenue');
    return {
        totalRevenue: Math.round(currentRevenue.totalRevenue * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        monthlyRevenue: filledMonthlyRevenue,
        revenueByCategory,
        averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
        ticketsSold: currentRevenue.ticketsSold,
    };
};
exports.getRevenueStats = getRevenueStats;
// Get event status statistics
const getEventStatusStats = async () => {
    const result = await event_model_1.Event.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);
    // Convert array to object with default values
    const statusStats = {
        pending: 0,
        approved: 0,
        published: 0,
        completed: 0,
        cancelled: 0,
        archived: 0,
        rejected: 0,
    };
    result.forEach(item => {
        statusStats[item._id] = item.count;
    });
    return statusStats;
};
exports.getEventStatusStats = getEventStatusStats;
// Get organizer dashboard stats
const getOrganizerDashboardStats = async (organizerId) => {
    var _a, _b;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Get all stats in parallel
    const [totalEvents, activeEvents, eventsCreatedThisMonth, totalFollowers, currentRevenue, lastMonthActiveEvents, lastMonthEventsCreated, lastMonthFollowers, lastMonthRevenue, viewsAndEngagementData,] = await Promise.all([
        // Total Events
        event_model_1.Event.countDocuments({ organizerId }),
        // Active Events
        event_model_1.Event.countDocuments({
            organizerId,
            startDate: { $gte: new Date().toISOString().split('T')[0] },
            status: { $in: [event_1.EVENT_STATUS.APPROVED, event_1.EVENT_STATUS.PUBLISHED] },
        }),
        // Events Created This Month
        event_model_1.Event.countDocuments({
            organizerId,
            createdAt: { $gte: startOfCurrentMonth },
        }),
        // Total Followers
        follow_model_1.Follow.countDocuments({ following: organizerId }),
        // Total Revenue (Current)
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new mongoose_1.Types.ObjectId(organizerId), // Ensure ObjectId match if needed, but mongoose auto-casts usually
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.countDocuments({
            organizerId,
            startDate: {
                $gte: startOfLastMonth.toISOString().split('T')[0],
                $lt: startOfCurrentMonth.toISOString().split('T')[0],
            },
            status: { $in: [event_1.EVENT_STATUS.APPROVED, event_1.EVENT_STATUS.PUBLISHED] },
        }),
        event_model_1.Event.countDocuments({
            organizerId,
            createdAt: {
                $gte: startOfLastMonth,
                $lt: startOfCurrentMonth,
            },
        }),
        follow_model_1.Follow.countDocuments({
            following: organizerId,
            createdAt: { $lt: startOfCurrentMonth },
        }),
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        // Total Views and Engagement Data
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new mongoose_1.Types.ObjectId(organizerId),
                },
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'reviews',
                },
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: { $ifNull: ['$views', 0] } },
                    totalFavorites: { $sum: { $ifNull: ['$favorites', 0] } },
                    totalTicketsSold: { $sum: { $ifNull: ['$ticketsSold', 0] } },
                    totalReviews: { $sum: { $size: '$reviews' } },
                },
            },
        ]),
    ]);
    const revenue = ((_a = currentRevenue[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    const lastRevenue = ((_b = lastMonthRevenue[0]) === null || _b === void 0 ? void 0 : _b.totalRevenue) || 0;
    // Extract views and engagement data
    const engagementData = viewsAndEngagementData[0] || {
        totalViews: 0,
        totalFavorites: 0,
        totalTicketsSold: 0,
        totalReviews: 0,
    };
    // Calculate average engagement rate
    // Engagement = (favorites + reviews + tickets sold) / views * 100
    const totalInteractions = engagementData.totalFavorites +
        engagementData.totalReviews +
        engagementData.totalTicketsSold;
    const avgEngagement = engagementData.totalViews > 0
        ? (totalInteractions / engagementData.totalViews) * 100
        : 0;
    // Calculate growth percentages
    const eventGrowth = lastMonthActiveEvents > 0
        ? ((activeEvents - lastMonthActiveEvents) / lastMonthActiveEvents) * 100
        : activeEvents > 0
            ? 100
            : 0;
    const eventsCreatedGrowth = lastMonthEventsCreated > 0
        ? ((eventsCreatedThisMonth - lastMonthEventsCreated) /
            lastMonthEventsCreated) *
            100
        : eventsCreatedThisMonth > 0
            ? 100
            : 0;
    const followersGrowth = lastMonthFollowers > 0
        ? ((totalFollowers - lastMonthFollowers) / lastMonthFollowers) * 100
        : totalFollowers > 0
            ? 100
            : 0;
    const revenueGrowth = lastRevenue > 0
        ? ((revenue - lastRevenue) / lastRevenue) * 100
        : revenue > 0
            ? 100
            : 0;
    return {
        totalEvents,
        activeEvents,
        eventsCreated: eventsCreatedThisMonth,
        totalFollowers,
        totalRevenue: Math.round(revenue * 100) / 100,
        totalViews: engagementData.totalViews,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        eventGrowth: Math.round(eventGrowth * 10) / 10,
        eventsCreatedGrowth: Math.round(eventsCreatedGrowth * 10) / 10,
        followersGrowth: Math.round(followersGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    };
};
exports.getOrganizerDashboardStats = getOrganizerDashboardStats;
// Get organizer event statistics
const getOrganizerEventStats = async (organizerId, months = 6) => {
    var _a;
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const currentDate = new Date().toISOString().split('T')[0];
    const [totalEvents, upcomingEvents, completedEvents, cancelledEvents, revenueData, ticketData, eventTrend, categoryDistribution,] = await Promise.all([
        event_model_1.Event.countDocuments({ organizerId }),
        event_model_1.Event.countDocuments({
            organizerId,
            startDate: { $gte: currentDate },
            status: { $in: [event_1.EVENT_STATUS.APPROVED, event_1.EVENT_STATUS.PUBLISHED] },
        }),
        event_model_1.Event.countDocuments({
            organizerId,
            startDate: { $lt: currentDate },
            status: event_1.EVENT_STATUS.COMPLETED,
        }),
        event_model_1.Event.countDocuments({ organizerId, status: event_1.EVENT_STATUS.CANCELLED }),
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new mongoose_1.Types.ObjectId(organizerId),
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
        event_model_1.Event.aggregate([
            { $match: { organizerId: new mongoose_1.Types.ObjectId(organizerId) } },
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
    ]);
    const revenue = revenueData[0] || {
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalCapacity: 0,
    };
    const avgTicketPrice = ((_a = ticketData[0]) === null || _a === void 0 ? void 0 : _a.averageTicketPrice) || 0;
    const occupancyRate = revenue.totalCapacity > 0
        ? (revenue.totalTicketsSold / revenue.totalCapacity) * 100
        : 0;
    const filledEventTrend = fillMissingMonths(eventTrend.map(item => ({ month: item.month, count: item.count })), months, 'count');
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
    };
};
exports.getOrganizerEventStats = getOrganizerEventStats;
// Get organizer revenue statistics
const getOrganizerRevenueStats = async (organizerId, months = 6) => {
    var _a, _b;
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [revenueData, lastMonthRevenueData, monthlyRevenue, revenueByCategory, ticketData,] = await Promise.all([
        // Current Revenue
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
        event_model_1.Event.aggregate([
            {
                $match: {
                    organizerId: new Object(organizerId),
                    status: {
                        $in: [
                            event_1.EVENT_STATUS.COMPLETED,
                            event_1.EVENT_STATUS.PUBLISHED,
                            event_1.EVENT_STATUS.APPROVED,
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
    ]);
    const currentRevenue = revenueData[0] || { totalRevenue: 0, ticketsSold: 0 };
    const lastMonthRevenue = ((_a = lastMonthRevenueData[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    const averageTicketPrice = ((_b = ticketData[0]) === null || _b === void 0 ? void 0 : _b.averageTicketPrice) || 0;
    const revenueGrowth = lastMonthRevenue > 0
        ? ((currentRevenue.totalRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
        : currentRevenue.totalRevenue > 0
            ? 100
            : 0;
    const filledMonthlyRevenue = fillMissingMonths(monthlyRevenue.map(item => ({ month: item.month, revenue: item.revenue })), months, 'revenue');
    return {
        totalRevenue: Math.round(currentRevenue.totalRevenue * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        monthlyRevenue: filledMonthlyRevenue,
        revenueByCategory,
        averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
        ticketsSold: currentRevenue.ticketsSold,
    };
};
exports.getOrganizerRevenueStats = getOrganizerRevenueStats;
// Get organizer event status statistics
const getOrganizerEventStatusStats = async (organizerId) => {
    const result = await event_model_1.Event.aggregate([
        {
            $match: { organizerId: new mongoose_1.Types.ObjectId(organizerId) },
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);
    const statusStats = {
        pending: 0,
        approved: 0,
        published: 0,
        completed: 0,
        cancelled: 0,
        archived: 0,
        rejected: 0,
    };
    result.forEach(item => {
        statusStats[item._id] = item.count;
    });
    return statusStats;
};
exports.getOrganizerEventStatusStats = getOrganizerEventStatusStats;
// Get organizer app summary
const getOrganizerAppSummary = async (organizerId) => {
    const [dashboard, events, revenue, status] = await Promise.all([
        (0, exports.getOrganizerDashboardStats)(organizerId),
        (0, exports.getOrganizerEventStats)(organizerId),
        (0, exports.getOrganizerRevenueStats)(organizerId),
        (0, exports.getOrganizerEventStatusStats)(organizerId),
    ]);
    return {
        dashboard,
        events,
        revenue,
        status,
    };
};
exports.getOrganizerAppSummary = getOrganizerAppSummary;
// Get app summary (all stats)
const getAppSummary = async () => {
    const [dashboard, events, users, revenue, status] = await Promise.all([
        (0, exports.getAdminDashboardStats)(),
        (0, exports.getEventStats)(),
        (0, exports.getUserStats)(),
        (0, exports.getRevenueStats)(),
        (0, exports.getEventStatusStats)(),
    ]);
    return {
        dashboard,
        events,
        users,
        revenue,
        status,
    };
};
exports.getAppSummary = getAppSummary;
// Get individual event statistics (for event organizer view)
const getIndividualEventStats = async (eventId, days = 7) => {
    const { Ticket } = await Promise.resolve().then(() => __importStar(require('../ticket/ticket.model')));
    // Calculate date range for daily stats
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Get event details and ticket data in parallel
    const [eventData, ticketStats, dailyTicketData] = await Promise.all([
        event_model_1.Event.findById(eventId).select('capacity views ticketPrice ticketsSold address startDate category title'),
        // Get ticket statistics
        Ticket.aggregate([
            {
                $match: {
                    eventId: new Object(eventId),
                    paymentStatus: 'paid',
                },
            },
            {
                $group: {
                    _id: null,
                    totalTickets: { $sum: '$quantity' },
                    totalRevenue: { $sum: '$finalAmount' },
                },
            },
        ]),
        // Get daily ticket sales and revenue
        Ticket.aggregate([
            {
                $match: {
                    eventId: new Object(eventId),
                    paymentStatus: 'paid',
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    sales: { $sum: '$quantity' },
                    revenue: { $sum: '$finalAmount' },
                },
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
            },
        ]),
    ]);
    if (!eventData) {
        throw new Error('Event not found');
    }
    const ticketData = ticketStats[0] || { totalTickets: 0, totalRevenue: 0 };
    const totalViews = eventData.views || 0;
    const ticketsSold = ticketData.totalTickets;
    const totalRevenue = ticketData.totalRevenue;
    const averageTicketPrice = ticketsSold > 0 ? totalRevenue / ticketsSold : 0;
    const conversionRate = totalViews > 0 ? (ticketsSold / totalViews) * 100 : 0;
    // Create a map of daily data
    const dailyDataMap = new Map();
    dailyTicketData.forEach(item => {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);
        const dateStr = date.toISOString().split('T')[0];
        dailyDataMap.set(dateStr, {
            sales: item.sales,
            revenue: item.revenue,
        });
    });
    // Fill in missing days with zeros
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = dailyDataMap.get(dateStr) || { sales: 0, revenue: 0 };
        // For views, we'll distribute total views evenly across days (simplified approach)
        // In a real app, you'd track daily views separately
        const dailyViews = Math.floor(totalViews / days);
        dailyStats.push({
            date: dateStr,
            views: dailyViews,
            sales: dayData.sales,
            revenue: Math.round(dayData.revenue * 100) / 100,
        });
    }
    return {
        totalViews,
        ticketsSold,
        capacity: eventData.capacity,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        address: eventData.address,
        title: eventData.title,
        startDate: eventData.startDate,
        category: eventData.category,
        dailyStats,
    };
};
exports.getIndividualEventStats = getIndividualEventStats;
// Get shared event analytics (Admin & Organizer)
const getEventAnalytics = async (eventId) => {
    const { Ticket } = await Promise.resolve().then(() => __importStar(require('../ticket/ticket.model')));
    // Calculate last 7 days range
    const days = 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Start of the day 7 days ago
    const [eventData, ticketStats, dailyTicketData, dailyReviewData, dailySavedData,] = await Promise.all([
        event_model_1.Event.findById(eventId).select('views'),
        // Total Ticket Stats
        Ticket.aggregate([
            {
                $match: {
                    eventId: new Object(eventId),
                    paymentStatus: 'paid',
                },
            },
            {
                $group: {
                    _id: null,
                    totalTickets: { $sum: '$quantity' },
                    totalRevenue: { $sum: '$finalAmount' },
                },
            },
        ]),
        // Daily Ticket Sales
        Ticket.aggregate([
            {
                $match: {
                    eventId: new Object(eventId),
                    paymentStatus: 'paid',
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    sales: { $sum: '$quantity' },
                    revenue: { $sum: '$finalAmount' },
                },
            },
        ]),
        // Daily Reviews (Engagement)
        review_model_1.Review.aggregate([
            {
                $match: {
                    eventId: new Object(eventId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
        ]),
        // Daily Saved Events (Engagement)
        savedEvent_model_1.SavedEvent.aggregate([
            {
                $match: {
                    event: new mongoose_1.Types.ObjectId(eventId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);
    if (!eventData) {
        throw new Error('Event not found');
    }
    const ticketData = ticketStats[0] || { totalTickets: 0, totalRevenue: 0 };
    const totalViews = eventData.views || 0;
    const totalSales = ticketData.totalTickets;
    const totalRevenue = ticketData.totalRevenue;
    // Calculate total engagement (Saved + Reviews + Sales)
    // Note: This is an approximation of total lifetime engagement if we don't query all-time aggregate
    // For now, let's use the all-time counts from event/reviews if available, or just sum the daily ones if that's what we have.
    // Actually, let's get total counts for engagement separately to be accurate for "Total Engagement"
    // optimizing: reuse existing queries or add new ones. 
    // For the sake of performance, let's just use what we have or do a quick count.
    // "Engagement" usually means interactive actions.
    const [totalReviews, totalSaved] = await Promise.all([
        review_model_1.Review.countDocuments({ eventId }),
        savedEvent_model_1.SavedEvent.countDocuments({ event: eventId }),
    ]);
    const totalEngagement = totalReviews + totalSaved + totalSales;
    // Process daily data
    const processedData = new Map();
    // Helper to get date string key
    const getDateKey = (id) => {
        const date = new Date(id.year, id.month - 1, id.day);
        return date.toISOString().split('T')[0];
    };
    // Merge Ticket Data
    dailyTicketData.forEach(item => {
        const dateStr = getDateKey(item._id);
        const existing = processedData.get(dateStr) || { sales: 0, revenue: 0, engagement: 0 };
        existing.sales += item.sales;
        existing.revenue += item.revenue;
        existing.engagement += item.sales; // Sales count as engagement
        processedData.set(dateStr, existing);
    });
    // Merge Review Data
    dailyReviewData.forEach(item => {
        const dateStr = getDateKey(item._id);
        const existing = processedData.get(dateStr) || { sales: 0, revenue: 0, engagement: 0 };
        existing.engagement += item.count;
        processedData.set(dateStr, existing);
    });
    // Merge Saved Data
    dailySavedData.forEach(item => {
        const dateStr = getDateKey(item._id);
        const existing = processedData.get(dateStr) || { sales: 0, revenue: 0, engagement: 0 };
        existing.engagement += item.count;
        processedData.set(dateStr, existing);
    });
    // Format result with filled dates
    const dailyStats = [];
    // Daily views approximation (Total Views / Age of event or just Views / 7 for trend)
    // Since we don't have daily views, we will distribute total views proportional to engagement or just evenly for the graph shape.
    // Or simply returning a flat average for the graph to not stay empty.
    // The image shows a curve, so flat line is boring.
    // Better approach: Use engagement trend to weight the viewing trend? Or just random variation around average?
    // Let's stick to even distribution for now to be safe, or 0 if no views.
    // Actually, commonly if we lack data, we show 0 or flat. 
    // Let's use: (Total Views / 30) or similar as a baseline, and if created recently, use age.
    // For the graph "Last 7 Days", we just show the average daily view count based on total.
    const diffTime = Math.abs(new Date().getTime() - (eventData.createdAt || new Date()).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const avgDailyViews = Math.ceil(totalViews / diffDays);
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = processedData.get(dateStr) || { sales: 0, revenue: 0, engagement: 0 };
        dailyStats.push({
            date: dateStr,
            views: avgDailyViews, // Fallback as we don't track daily views
            engagement: dayData.engagement,
            sales: dayData.sales,
            revenue: Math.round(dayData.revenue * 100) / 100,
        });
    }
    return {
        totalViews,
        totalEngagement,
        totalSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        dailyStats
    };
};
exports.getEventAnalytics = getEventAnalytics;
// Get top three revenue events
const getTopThreeRevenueEvents = async () => {
    const result = await event_model_1.Event.aggregate([
        {
            $match: {
                status: {
                    $in: [
                        event_1.EVENT_STATUS.COMPLETED,
                        event_1.EVENT_STATUS.PUBLISHED,
                        event_1.EVENT_STATUS.APPROVED,
                    ],
                },
            },
        },
        {
            $project: {
                title: 1,
                images: 1,
                ticketPrice: 1,
                ticketsSold: 1,
                category: 1,
                totalRevenue: { $multiply: ['$ticketPrice', '$ticketsSold'] },
            },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 3 },
        {
            $project: {
                _id: 0,
                eventId: '$_id',
                title: 1,
                images: 1,
                ticketPrice: 1,
                ticketsSold: 1,
                category: 1,
                totalRevenue: { $round: ['$totalRevenue', 2] },
            },
        },
    ]);
    return result;
};
// Get organizer upcoming events
const getOrganizerUpcomingEvents = async (organizerId) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const result = await event_model_1.Event.find({
        organizerId,
        startDate: { $gte: currentDate },
        status: { $in: [event_1.EVENT_STATUS.APPROVED, event_1.EVENT_STATUS.PUBLISHED] },
    })
        .sort({ startDate: 1, startTime: 1 })
        .select('title images startDate startTime location address category ticketPrice ticketsSold capacity')
        .limit(10);
    return result;
};
// Get organizer promotion stats
const getOrganizerPromotionStats = async (organizerId) => {
    var _a;
    const now = new Date();
    const [activePromotions, totalPromotions, redemptionsResult] = await Promise.all([
        // Active Promotions: created by organizer, isActive, and not expired
        promotion_model_1.Promotion.countDocuments({
            createdBy: organizerId,
            isActive: true,
            validUntil: { $gte: now },
        }),
        // Total Promotions: created by organizer
        promotion_model_1.Promotion.countDocuments({ createdBy: organizerId }),
        // Total Redemptions: sum of usedCount for promotions created by organizer
        promotion_model_1.Promotion.aggregate([
            { $match: { createdBy: organizerId } },
            { $group: { _id: null, totalRedemptions: { $sum: '$usedCount' } } },
        ]),
    ]);
    return {
        activePromotions,
        totalPromotions,
        totalRedemptions: ((_a = redemptionsResult[0]) === null || _a === void 0 ? void 0 : _a.totalRedemptions) || 0,
    };
};
exports.getOrganizerPromotionStats = getOrganizerPromotionStats;
// Get content moderation stats (support tickets)
const getContentModerationStats = async () => {
    const result = await support_model_1.Support.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);
    // Convert array to object with default values
    const statusStats = {
        deleted: 0,
        solved: 0,
        in_progress: 0,
        dismissed: 0,
    };
    result.forEach(item => {
        if (item._id && statusStats.hasOwnProperty(item._id)) {
            statusStats[item._id] = item.count;
        }
    });
    return statusStats;
};
exports.getContentModerationStats = getContentModerationStats;
// Get event created this week count per day
const getWeeklyEventCreatedStats = async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    // Set to current week's Sunday 00:00:00
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const result = await event_model_1.Event.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfWeek,
                    $lte: endOfWeek,
                },
            },
        },
        {
            $group: {
                _id: { $dayOfWeek: '$createdAt' },
                count: { $sum: 1 },
            },
        },
    ]);
    const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];
    const stats = days.map((day, index) => {
        // MongoDB $dayOfWeek returns 1 for Sunday, 2 for Monday, etc.
        const dayData = result.find(item => item._id === index + 1);
        return {
            day,
            count: dayData ? dayData.count : 0,
        };
    });
    return stats;
};
exports.getWeeklyEventCreatedStats = getWeeklyEventCreatedStats;
// Get user engagement breakdown (Highly Active vs Inactive) trend for 12 months
const getUserEngagementStats = async () => {
    const result = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        // A user is considered "Highly Active" if they have at least one activity in the last 30 days from that month's end point
        // For historical data, we simplify: In that month, how many users were active?
        // Based on user request image, we need a trend.
        // Let's define:
        // Highly Active: Users who had activity in that specific month.
        // Inactive: Users who were registered but had no activity in that specific month.
        const [activeCount, totalUsersAtPoint] = await Promise.all([
            // Users who had activity in this month
            activity_model_1.Activity.distinct('userId', {
                timestamp: { $gte: startOfMonth, $lte: endOfMonth },
            }).then(users => users.length),
            // Total users registered up to the end of this month
            user_model_1.User.countDocuments({
                createdAt: { $lte: endOfMonth },
                role: user_1.USER_ROLES.USER, // Focusing on regular users
            }),
        ]);
        result.push({
            month: getMonthName(startOfMonth.getMonth()),
            highlyActive: activeCount,
            inactive: Math.max(0, totalUsersAtPoint - activeCount),
        });
    }
    return result;
};
exports.getUserEngagementStats = getUserEngagementStats;
exports.EventStatsServices = {
    getAdminDashboardStats: exports.getAdminDashboardStats,
    getEventStats: exports.getEventStats,
    getUserStats: exports.getUserStats,
    getRevenueStats: exports.getRevenueStats,
    getEventStatusStats: exports.getEventStatusStats,
    getAppSummary: exports.getAppSummary,
    getOrganizerDashboardStats: exports.getOrganizerDashboardStats,
    getOrganizerEventStats: exports.getOrganizerEventStats,
    getOrganizerRevenueStats: exports.getOrganizerRevenueStats,
    getOrganizerEventStatusStats: exports.getOrganizerEventStatusStats,
    getOrganizerAppSummary: exports.getOrganizerAppSummary,
    getIndividualEventStats: exports.getIndividualEventStats,
    getEventAnalytics: exports.getEventAnalytics,
    getOrganizerPromotionStats: exports.getOrganizerPromotionStats,
    getTopThreeRevenueEvents,
    getOrganizerUpcomingEvents,
    getContentModerationStats: exports.getContentModerationStats,
    getWeeklyEventCreatedStats: exports.getWeeklyEventCreatedStats,
    getUserEngagementStats: exports.getUserEngagementStats,
};
