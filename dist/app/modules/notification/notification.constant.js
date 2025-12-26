"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_SUBJECTS = exports.NOTIFICATION_CONFIG = exports.NOTIFICATION_TEMPLATES = exports.notificationFilterableFields = exports.notificationSearchableFields = void 0;
const notification_interface_1 = require("./notification.interface");
exports.notificationSearchableFields = ['title', 'content'];
exports.notificationFilterableFields = [
    'searchTerm',
    'userId',
    'type',
    'channel',
    'status',
    'priority',
    'isRead',
    'isArchived',
    'startDate',
    'endDate',
];
exports.NOTIFICATION_TEMPLATES = {
    // Event Templates
    EVENT_REMINDER: 'event-reminder',
    EVENT_CREATED: 'event-created',
    EVENT_UPDATED: 'event-updated',
    EVENT_CANCELLED: 'event-cancelled',
    // Ticket Templates
    TICKET_CONFIRMATION: 'ticket-confirmation',
    TICKET_REFUND: 'ticket-refund',
    // Payment Templates
    PAYMENT_SUCCESS: 'payment-success',
    PAYMENT_FAILED: 'payment-failed',
    PAYMENT_REFUNDED: 'payment-refunded',
    // User Templates
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password-reset',
    ACCOUNT_VERIFICATION: 'account-verification',
    PROFILE_UPDATED: 'profile-updated',
    // System Templates
    SYSTEM_ALERT: 'system-alert',
    MAINTENANCE: 'maintenance',
    NEW_FEATURE: 'new-feature',
    // Attendee Templates
    ATTENDEE_CHECKED_IN: 'attendee-checked-in',
    ATTENDEE_REMINDER: 'attendee-reminder',
    // Organizer Templates
    NEW_ATTENDEE: 'new-attendee',
    EVENT_STATISTICS: 'event-statistics',
};
exports.NOTIFICATION_CONFIG = {
    // Priority levels with default channel
    PRIORITY_CONFIG: {
        [notification_interface_1.NotificationPriority.URGENT]: {
            channel: notification_interface_1.NotificationChannel.BOTH,
            retryAttempts: 3,
        },
        [notification_interface_1.NotificationPriority.HIGH]: {
            channel: notification_interface_1.NotificationChannel.BOTH,
            retryAttempts: 2,
        },
        [notification_interface_1.NotificationPriority.MEDIUM]: {
            channel: notification_interface_1.NotificationChannel.EMAIL,
            retryAttempts: 1,
        },
        [notification_interface_1.NotificationPriority.LOW]: {
            channel: notification_interface_1.NotificationChannel.IN_APP,
            retryAttempts: 0,
        },
    },
    // Default settings
    DEFAULT_CHANNEL: notification_interface_1.NotificationChannel.IN_APP,
    DEFAULT_PRIORITY: notification_interface_1.NotificationPriority.MEDIUM,
    DEFAULT_RETRY_DELAY: 30000, // 30 seconds
    MAX_RETRY_ATTEMPTS: 3,
    BATCH_SIZE: 50,
    // Scheduled notification settings
    SCHEDULED_CHECK_INTERVAL: 60000, // 1 minute
    CLEANUP_ARCHIVED_AFTER_DAYS: 30,
};
exports.EMAIL_SUBJECTS = {
    [notification_interface_1.NotificationType.EVENT_REMINDER]: 'Event Reminder: {eventTitle}',
    [notification_interface_1.NotificationType.TICKET_CONFIRMATION]: 'Ticket Confirmation - {eventTitle}',
    [notification_interface_1.NotificationType.PAYMENT_SUCCESS]: 'Payment Successful - {eventTitle}',
    [notification_interface_1.NotificationType.PAYMENT_FAILED]: 'Payment Failed - {eventTitle}',
    [notification_interface_1.NotificationType.EVENT_CREATED]: 'New Event Created: {eventTitle}',
    [notification_interface_1.NotificationType.EVENT_UPDATED]: 'Event Updated: {eventTitle}',
    [notification_interface_1.NotificationType.EVENT_CANCELLED]: 'Event Cancelled: {eventTitle}',
    [notification_interface_1.NotificationType.ATTENDEE_CHECKED_IN]: 'Check-in Confirmation - {eventTitle}',
    [notification_interface_1.NotificationType.WELCOME]: 'Welcome to EventHub!',
    [notification_interface_1.NotificationType.PASSWORD_RESET]: 'Password Reset Request',
    [notification_interface_1.NotificationType.ACCOUNT_VERIFICATION]: 'Verify Your Account',
    [notification_interface_1.NotificationType.SYSTEM_ALERT]: 'System Alert',
    [notification_interface_1.NotificationType.PROMOTIONAL]: '{subject}',
};
