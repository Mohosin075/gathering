"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const notification_interface_1 = require("./notification.interface");
const notification_model_1 = require("./notification.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const notification_constant_1 = require("./notification.constant");
const mongoose_1 = require("mongoose");
const notification_providers_1 = require("./notification.providers");
const user_model_1 = require("../user/user.model");
const event_model_1 = require("../event/event.model");
const ticket_model_1 = require("../ticket/ticket.model");
const payment_model_1 = require("../payment/payment.model");
const attendee_model_1 = require("../attendee/attendee.model");
const config_1 = __importDefault(require("../../../config"));
const server_1 = require("../../../server");
const createNotification = async (payload, sendEmail = false) => {
    try {
        const notificationData = {
            userId: payload.userId,
            title: payload.title,
            content: payload.content,
            type: payload.type,
            channel: payload.channel || notification_interface_1.NotificationChannel.IN_APP,
            priority: payload.priority,
            metadata: payload.metadata || {},
            actionUrl: payload.actionUrl,
            actionText: payload.actionText,
        };
        if (payload.scheduledAt) {
            notificationData.scheduledAt = payload.scheduledAt;
            notificationData.status = notification_interface_1.NotificationStatus.PENDING;
        }
        const notification = await notification_model_1.Notification.create(notificationData);
        // Send real-time notification via socket
        if (notification.channel !== notification_interface_1.NotificationChannel.EMAIL) {
            // Emit socket event for real-time notification
            // const io = (global as any).io
            if (server_1.io) {
                server_1.io.to(notification.userId.toString()).emit('notification', {
                    type: 'NEW_NOTIFICATION',
                    data: notification,
                });
                console.log({ notification });
            }
        }
        // Send email if requested
        if (sendEmail && notification.channel !== notification_interface_1.NotificationChannel.IN_APP) {
            await sendNotificationEmail(notification);
        }
        return notification;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create notification: ${error.message}`);
    }
};
const sendNotificationEmail = async (notification) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const user = await user_model_1.User.findById(notification.userId);
        if (!user || !user.email) {
            throw new Error('User not found or no email available');
        }
        let template = 'system-alert';
        let templateData = {
            userName: user.name,
            notificationTitle: notification.title,
            notificationContent: notification.content,
            actionUrl: notification.actionUrl,
            actionText: notification.actionText,
        };
        // Map notification type to template and add specific data
        switch (notification.type) {
            case notification_interface_1.NotificationType.TICKET_CONFIRMATION:
                template = 'ticket-confirmation';
                if ((_a = notification.metadata) === null || _a === void 0 ? void 0 : _a.ticketId) {
                    const ticket = await ticket_model_1.Ticket.findById(notification.metadata.ticketId).populate('eventId', 'title startDate location venue');
                    if (ticket) {
                        const populatedEvent = ticket.eventId;
                        templateData = {
                            ...templateData,
                            eventTitle: populatedEvent === null || populatedEvent === void 0 ? void 0 : populatedEvent.title,
                            eventDate: (_b = populatedEvent === null || populatedEvent === void 0 ? void 0 : populatedEvent.startDate) === null || _b === void 0 ? void 0 : _b.toLocaleDateString(),
                            eventTime: (_c = populatedEvent === null || populatedEvent === void 0 ? void 0 : populatedEvent.startDate) === null || _c === void 0 ? void 0 : _c.toLocaleTimeString(),
                            eventLocation: (populatedEvent === null || populatedEvent === void 0 ? void 0 : populatedEvent.location) || (populatedEvent === null || populatedEvent === void 0 ? void 0 : populatedEvent.venue),
                            ticketType: ticket.ticketType,
                            quantity: ticket.quantity,
                            orderId: ticket._id,
                            amount: ticket.finalAmount,
                            currency: ticket.currency,
                            qrCodeUrl: `${config_1.default.clientUrl}/api/v1/tickets/${ticket._id}/qrcode`,
                        };
                    }
                }
                break;
            case notification_interface_1.NotificationType.EVENT_REMINDER:
                template = 'event-reminder';
                if ((_d = notification.metadata) === null || _d === void 0 ? void 0 : _d.eventId) {
                    const event = (await event_model_1.Event.findById(notification.metadata.eventId).populate('organizerId', 'name email'));
                    if (event) {
                        const timeUntilEvent = Math.floor((new Date(event.startDate).getTime() - Date.now()) /
                            (1000 * 60 * 60));
                        templateData = {
                            ...templateData,
                            eventTitle: event.title,
                            eventStart: event.startDate.toLocaleString(),
                            eventLocation: event.location || event.venue,
                            eventDuration: `${event.duration} hours`,
                            timeUntilEvent: timeUntilEvent > 24
                                ? `in ${Math.floor(timeUntilEvent / 24)} days`
                                : `in ${timeUntilEvent} hours`,
                            locationInstructions: event.locationInstructions,
                        };
                    }
                }
                break;
            case notification_interface_1.NotificationType.PAYMENT_SUCCESS:
                template = 'payment-success';
                if ((_e = notification.metadata) === null || _e === void 0 ? void 0 : _e.paymentId) {
                    const payment = await payment_model_1.Payment.findById(notification.metadata.paymentId);
                    if (payment) {
                        const event = await event_model_1.Event.findById(payment.eventId);
                        templateData = {
                            ...templateData,
                            eventTitle: (event === null || event === void 0 ? void 0 : event.title) || 'Event',
                            transactionId: payment._id,
                            amount: payment.amount,
                            currency: payment.currency,
                            paymentMethod: payment.paymentMethod,
                            paymentDate: payment.createdAt.toLocaleDateString(),
                        };
                    }
                }
                break;
            case notification_interface_1.NotificationType.WELCOME:
                template = 'welcome';
                break;
            case notification_interface_1.NotificationType.PASSWORD_RESET:
                template = 'password-reset';
                if ((_f = notification.metadata) === null || _f === void 0 ? void 0 : _f.resetCode) {
                    templateData.resetCode = notification.metadata.resetCode;
                    templateData.expiryMinutes = 30;
                }
                break;
            case notification_interface_1.NotificationType.ACCOUNT_VERIFICATION:
                template = 'account-verification';
                if ((_g = notification.metadata) === null || _g === void 0 ? void 0 : _g.verificationToken) {
                    templateData.verificationUrl = `${config_1.default.clientUrl}/verify-email?token=${notification.metadata.verificationToken}`;
                }
                break;
            case notification_interface_1.NotificationType.ATTENDEE_CHECKED_IN:
                template = 'attendee-checked-in';
                if ((_h = notification.metadata) === null || _h === void 0 ? void 0 : _h.attendeeId) {
                    const attendee = await attendee_model_1.Attendee.findById(notification.metadata.attendeeId)
                        .populate('eventId', 'title')
                        .populate('checkInBy', 'name');
                    if (attendee) {
                        const eventInfo = attendee.eventId;
                        const checkInByInfo = attendee.checkInBy;
                        templateData = {
                            ...templateData,
                            eventTitle: eventInfo === null || eventInfo === void 0 ? void 0 : eventInfo.title,
                            checkInTime: (_j = attendee.checkInTime) === null || _j === void 0 ? void 0 : _j.toLocaleString(),
                            checkedInBy: (checkInByInfo === null || checkInByInfo === void 0 ? void 0 : checkInByInfo.name) || 'Organizer',
                            ticketNumber: attendee._id.toString().slice(-8).toUpperCase(),
                        };
                    }
                }
                break;
            default:
                template = 'system-alert';
        }
        await notification_providers_1.emailProvider.sendTemplateEmail(user.email, template, templateData, notification.title);
        // Update notification status
        await notification_model_1.Notification.findByIdAndUpdate(notification._id, {
            status: notification_interface_1.NotificationStatus.SENT,
            sentAt: new Date(),
        });
    }
    catch (error) {
        console.error('Failed to send notification email:', error);
        // Update notification status to failed
        await notification_model_1.Notification.findByIdAndUpdate(notification._id, {
            status: notification_interface_1.NotificationStatus.FAILED,
            metadata: {
                ...notification.metadata,
                emailError: error.message,
            },
        });
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to send email notification: ${error.message}`);
    }
};
const createNotificationForEvent = async (eventId, type, title, content, metadata) => {
    try {
        // Get all attendees for the event
        const attendees = await attendee_model_1.Attendee.find({ eventId }).populate('userId', 'email name');
        const notifications = attendees.map(attendee => {
            var _a;
            return ({
                userId: ((_a = attendee.userId) === null || _a === void 0 ? void 0 : _a._id) || attendee.userId,
                title,
                content,
                type,
                channel: notification_interface_1.NotificationChannel.BOTH,
                priority: notification_interface_1.NotificationPriority.MEDIUM,
                metadata: {
                    ...metadata,
                    eventId,
                    attendeeId: attendee._id,
                },
            });
        });
        // Create notifications in batches
        const batchSize = 50;
        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            await notification_model_1.Notification.insertMany(batch);
        }
        console.log(`Created ${notifications.length} notifications for event ${eventId}`);
    }
    catch (error) {
        console.error('Failed to create event notifications:', error);
        throw error;
    }
};
const getAllNotifications = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search term
    if (searchTerm) {
        andConditions.push({
            $or: notification_constant_1.notificationSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm,
                    $options: 'i',
                },
            })),
        });
    }
    // Filter by other fields
    if (Object.keys(filterData).length) {
        const filterEntries = Object.entries(filterData);
        filterEntries.forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'startDate' || key === 'endDate') {
                    // Date filtering - ensure value is string
                    const dateCondition = {};
                    if (key === 'startDate' && typeof value === 'string') {
                        dateCondition.$gte = new Date(value);
                    }
                    if (key === 'endDate' && typeof value === 'string') {
                        dateCondition.$lte = new Date(value);
                    }
                    if (Object.keys(dateCondition).length > 0) {
                        andConditions.push({ createdAt: dateCondition });
                    }
                }
                else if (key === 'isRead' || key === 'isArchived') {
                    // Boolean filtering - convert string to boolean
                    andConditions.push({ [key]: value === 'true' });
                }
                else {
                    // Regular field filtering
                    andConditions.push({ [key]: value });
                }
            }
        });
    }
    // User-specific filtering (unless admin)
    if (user.role === 'user') {
        andConditions.push({
            userId: new mongoose_1.Types.ObjectId(user.authId),
        });
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total, analyticsData] = await Promise.all([
        notification_model_1.Notification.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('userId', 'name email')
            .lean(),
        notification_model_1.Notification.countDocuments(whereConditions),
        // Get overall analytics for the filtered notifications
        notification_model_1.Notification.aggregate([
            { $match: whereConditions },
            {
                $group: {
                    _id: null,
                    totalNotifications: { $sum: 1 },
                    readNotifications: {
                        $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] },
                    },
                    clickedNotifications: {
                        $sum: { $cond: [{ $ne: ['$actionClickedAt', null] }, 1, 0] },
                    },
                },
            },
        ]),
    ]);
    // Calculate overall analytics
    const stats = analyticsData[0] || {
        totalNotifications: 0,
        readNotifications: 0,
        clickedNotifications: 0,
    };
    const overallAnalytics = {
        openRate: stats.totalNotifications > 0
            ? Math.round((stats.readNotifications / stats.totalNotifications) * 100)
            : 0,
        engagement: stats.totalNotifications > 0
            ? Math.round((stats.clickedNotifications / stats.totalNotifications) * 100)
            : 0,
    };
    // Add individual analytics to each notification
    const notificationsWithAnalytics = result.map(notification => ({
        ...notification,
        analytics: {
            openRate: notification.isRead ? 100 : 0, // Individual notification is either open (100%) or not (0%)
            engagement: notification.actionClickedAt ? 100 : 0, // Individual notification action is either clicked (100%) or not (0%)
        },
    }));
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        analytics: overallAnalytics, // Overall analytics for all notifications matching the query
        data: notificationsWithAnalytics,
    };
};
const getNotificationById = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid notification ID');
    }
    const result = await notification_model_1.Notification.findById(id)
        .populate('userId', 'name email')
        .lean();
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    }
    return result;
};
const updateNotification = async (id, payload, userId) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid notification ID');
    }
    const query = { _id: id };
    if (userId) {
        query.userId = userId;
    }
    const result = await notification_model_1.Notification.findOneAndUpdate(query, { $set: payload }, { new: true, runValidators: true })
        .populate('userId', 'name email')
        .lean();
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    }
    return result;
};
const markAsRead = async (id, userId) => {
    const result = await notification_model_1.Notification.findOneAndUpdate({ _id: id, userId }, {
        isRead: true,
        readAt: new Date(),
        status: notification_interface_1.NotificationStatus.READ,
    }, { new: true })
        .populate('userId', 'name email')
        .lean();
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    }
    return result;
};
const markAllAsRead = async (userId) => {
    const result = await notification_model_1.Notification.updateMany({ userId, isRead: false }, {
        isRead: true,
        readAt: new Date(),
        status: notification_interface_1.NotificationStatus.READ,
    });
    return { modifiedCount: result.modifiedCount };
};
const archiveNotification = async (id, userId) => {
    const result = await notification_model_1.Notification.findOneAndUpdate({ _id: id, userId }, { isArchived: true }, { new: true })
        .populate('userId', 'name email')
        .lean();
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    }
    return result;
};
const deleteNotification = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid notification ID');
    }
    const result = await notification_model_1.Notification.findByIdAndDelete(id).lean();
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    }
    return result;
};
const getNotificationStats = async (user) => {
    const query = {};
    if (user.role === 'user') {
        query.userId = user.authId;
    }
    const [total, unread, byType, byChannel, byStatus] = await Promise.all([
        notification_model_1.Notification.countDocuments(query),
        notification_model_1.Notification.countDocuments({ ...query, isRead: false }),
        notification_model_1.Notification.aggregate([
            { $match: query },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        notification_model_1.Notification.aggregate([
            { $match: query },
            { $group: { _id: '$channel', count: { $sum: 1 } } },
        ]),
        notification_model_1.Notification.aggregate([
            { $match: query },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
    ]);
    const stats = {
        total,
        unread,
        byType: {},
        byChannel: {},
        byStatus: {},
    };
    byType.forEach(item => {
        stats.byType[item._id] = item.count;
    });
    byChannel.forEach(item => {
        stats.byChannel[item._id] = item.count;
    });
    byStatus.forEach(item => {
        stats.byStatus[item._id] = item.count;
    });
    return stats;
};
const getMyNotifications = async (user, pagination) => {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const query = { userId: user.authId, isArchived: false };
    const [result, total] = await Promise.all([
        notification_model_1.Notification.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean(),
        notification_model_1.Notification.countDocuments(query),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const sendTestEmail = async (to, template) => {
    try {
        const user = await user_model_1.User.findOne({ email: to });
        if (!user) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
        }
        const testData = {
            userName: user.name,
            eventTitle: 'Test Event - Annual Tech Conference 2024',
            eventDate: new Date().toLocaleDateString(),
            eventTime: new Date().toLocaleTimeString(),
            eventLocation: 'Convention Center, New York',
            ticketType: 'VIP Pass',
            quantity: 1,
            orderId: 'TEST123456',
            amount: '99.99',
            currency: 'USD',
            qrCodeUrl: 'https://via.placeholder.com/200x200/667eea/ffffff?text=QR+CODE',
            resetCode: 'ABC123',
            verificationUrl: `${config_1.default.clientUrl}/verify-email?token=test-token-123`,
            actionUrl: `${config_1.default.clientUrl}/dashboard`,
            actionText: 'Go to Dashboard',
        };
        await notification_providers_1.emailProvider.sendTemplateEmail(to, template, testData);
        return true;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to send test email: ${error.message}`);
    }
};
exports.NotificationServices = {
    createNotification,
    sendNotificationEmail,
    createNotificationForEvent,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    getNotificationStats,
    getMyNotifications,
    sendTestEmail,
};
