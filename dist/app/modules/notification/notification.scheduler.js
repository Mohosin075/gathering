"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationScheduler = exports.NotificationScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notification_model_1 = require("./notification.model");
const notification_service_1 = require("./notification.service");
const notification_interface_1 = require("./notification.interface");
const event_model_1 = require("../event/event.model");
const attendee_model_1 = require("../attendee/attendee.model");
const user_model_1 = require("../user/user.model");
class NotificationScheduler {
    constructor() {
        this.initializeSchedulers();
    }
    static getInstance() {
        if (!NotificationScheduler.instance) {
            NotificationScheduler.instance = new NotificationScheduler();
        }
        return NotificationScheduler.instance;
    }
    initializeSchedulers() {
        console.log('🕒 Initializing notification schedulers...');
        // Schedule 1: Process pending notifications every minute
        node_cron_1.default.schedule('* * * * *', async () => {
            await this.processPendingNotifications();
        });
        // Schedule 2: Send event reminders 24 hours before event
        node_cron_1.default.schedule('0 * * * *', async () => {
            // Every hour
            await this.sendEventReminders();
        });
        // Schedule 3: Clean up old archived notifications daily at 2 AM
        node_cron_1.default.schedule('0 2 * * *', async () => {
            await this.cleanupArchivedNotifications();
        });
        // Schedule 4: Send welcome emails to new users (within last hour)
        node_cron_1.default.schedule('*/15 * * * *', async () => {
            // Every 15 minutes
            await this.sendWelcomeEmails();
        });
        // Schedule 5: Check for upcoming events and send reminders (1 week before)
        node_cron_1.default.schedule('0 8 * * *', async () => {
            // Daily at 8 AM
            await this.sendWeeklyEventReminders();
        });
        console.log('✅ Notification schedulers initialized');
    }
    async processPendingNotifications() {
        var _a;
        try {
            const pendingNotifications = await notification_model_1.Notification.find({
                status: notification_interface_1.NotificationStatus.PENDING,
                scheduledAt: { $lte: new Date() },
                channel: { $ne: 'IN_APP' },
            }).limit(50);
            console.log(`📧 Processing ${pendingNotifications.length} pending notifications...`);
            for (const notification of pendingNotifications) {
                try {
                    await notification_service_1.NotificationServices.sendNotificationEmail(notification);
                }
                catch (error) {
                    console.error(`Failed to process notification ${notification._id}:`, error);
                    // Update status to failed after max retries
                    const retryCount = (((_a = notification.metadata) === null || _a === void 0 ? void 0 : _a.retryCount) || 0) + 1;
                    if (retryCount >= 3) {
                        await notification_model_1.Notification.findByIdAndUpdate(notification._id, {
                            status: notification_interface_1.NotificationStatus.FAILED,
                            metadata: {
                                ...notification.metadata,
                                retryCount,
                                lastError: error.message,
                            },
                        });
                    }
                    else {
                        // Update retry count and reschedule for later
                        await notification_model_1.Notification.findByIdAndUpdate(notification._id, {
                            scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes later
                            metadata: {
                                ...notification.metadata,
                                retryCount,
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error processing pending notifications:', error);
        }
    }
    async sendEventReminders() {
        try {
            const now = new Date();
            const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
            // Find events starting in the next 24 hours
            const upcomingEvents = await event_model_1.Event.find({
                startDate: {
                    $gte: oneHourLater,
                    $lte: twentyFourHoursLater,
                },
                status: 'published',
            });
            console.log(`⏰ Found ${upcomingEvents.length} events starting in next 24 hours`);
            for (const event of upcomingEvents) {
                // Check if reminder already sent
                const existingReminder = await notification_model_1.Notification.findOne({
                    type: notification_interface_1.NotificationType.EVENT_REMINDER,
                    'metadata.eventId': event._id,
                });
                if (existingReminder) {
                    continue; // Already sent
                }
                // Get all attendees for this event
                const attendees = await attendee_model_1.Attendee.find({ eventId: event._id }).populate('userId', 'email name');
                for (const attendee of attendees) {
                    // Create notification for each attendee
                    await notification_service_1.NotificationServices.createNotification({
                        userId: attendee.userId._id,
                        title: `Event Reminder: ${event.title}`,
                        content: `Don't forget! ${event.title} starts tomorrow at ${event.startDate.toLocaleTimeString()}.`,
                        type: notification_interface_1.NotificationType.EVENT_REMINDER,
                        channel: notification_interface_1.NotificationChannel.BOTH,
                        priority: notification_interface_1.NotificationPriority.HIGH,
                        metadata: {
                            eventId: event._id,
                            attendeeId: attendee._id,
                        },
                        actionUrl: `${process.env.CLIENT_URL}/events/${event._id}`,
                        actionText: 'View Event Details',
                    }, true); // Send email immediately
                }
                console.log(`Sent reminders for event: ${event.title}`);
            }
        }
        catch (error) {
            console.error('Error sending event reminders:', error);
        }
    }
    async sendWeeklyEventReminders() {
        try {
            const now = new Date();
            const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            // Find events starting in the next week
            const upcomingEvents = await event_model_1.Event.find({
                startDate: {
                    $gte: now,
                    $lte: oneWeekLater,
                },
                status: 'published',
            });
            console.log(`📅 Found ${upcomingEvents.length} events starting in next week`);
            for (const event of upcomingEvents) {
                const daysUntilEvent = Math.floor((event.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                // Only send for events 2-7 days away
                if (daysUntilEvent >= 2 && daysUntilEvent <= 7) {
                    const existingReminder = await notification_model_1.Notification.findOne({
                        type: notification_interface_1.NotificationType.EVENT_REMINDER,
                        'metadata.eventId': event._id,
                        'metadata.reminderType': 'weekly',
                    });
                    if (!existingReminder) {
                        // Get all attendees
                        const attendees = await attendee_model_1.Attendee.find({
                            eventId: event._id,
                        }).populate('userId', 'email name');
                        for (const attendee of attendees) {
                            await notification_service_1.NotificationServices.createNotification({
                                userId: attendee.userId._id,
                                title: `Upcoming Event: ${event.title}`,
                                content: `${event.title} is coming up in ${daysUntilEvent} days! Get ready for an amazing experience.`,
                                type: notification_interface_1.NotificationType.EVENT_REMINDER,
                                channel: notification_interface_1.NotificationChannel.BOTH,
                                priority: notification_interface_1.NotificationPriority.MEDIUM,
                                metadata: {
                                    eventId: event._id,
                                    attendeeId: attendee._id,
                                    reminderType: 'weekly',
                                    daysUntilEvent,
                                },
                                actionUrl: `${process.env.CLIENT_URL}/events/${event._id}`,
                                actionText: 'View Event',
                            }, true);
                        }
                        console.log(`Sent weekly reminder for event: ${event.title}`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error sending weekly event reminders:', error);
        }
    }
    async sendWelcomeEmails() {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            // Find users created in the last hour who haven't received welcome email
            const newUsers = await user_model_1.User.find({
                createdAt: { $gte: oneHourAgo },
                'metadata.welcomeEmailSent': { $ne: true },
            });
            console.log(`👋 Found ${newUsers.length} new users to welcome`);
            for (const user of newUsers) {
                try {
                    await notification_service_1.NotificationServices.createNotification({
                        userId: user._id,
                        title: 'Welcome to EventHub!',
                        content: `Welcome aboard, ${user.name}! We're excited to have you join our community.`,
                        type: notification_interface_1.NotificationType.WELCOME,
                        channel: notification_interface_1.NotificationChannel.BOTH,
                        priority: notification_interface_1.NotificationPriority.MEDIUM,
                        metadata: {
                            welcomeEmailSent: true,
                        },
                        actionUrl: `${process.env.CLIENT_URL}/dashboard`,
                        actionText: 'Get Started',
                    }, true);
                    // Mark welcome email as sent in user metadata
                    await user_model_1.User.findByIdAndUpdate(user._id, {
                        $set: {
                            'metadata.welcomeEmailSent': true,
                            'metadata.welcomeEmailSentAt': new Date(),
                        },
                    });
                    console.log(`Sent welcome email to: ${user.email}`);
                }
                catch (error) {
                    console.error(`Failed to send welcome email to ${user.email}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error sending welcome emails:', error);
        }
    }
    async cleanupArchivedNotifications() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const result = await notification_model_1.Notification.deleteMany({
                isArchived: true,
                updatedAt: { $lte: thirtyDaysAgo },
            });
            console.log(`🧹 Cleaned up ${result.deletedCount} archived notifications older than 30 days`);
        }
        catch (error) {
            console.error('Error cleaning up archived notifications:', error);
        }
    }
    // Public method to manually trigger schedulers (for testing)
    async triggerManualSchedule(type) {
        console.log(`🔧 Manually triggering scheduler: ${type}`);
        switch (type) {
            case 'reminders':
                await this.sendEventReminders();
                break;
            case 'welcome':
                await this.sendWelcomeEmails();
                break;
            case 'cleanup':
                await this.cleanupArchivedNotifications();
                break;
        }
        console.log(`✅ Manual scheduler completed: ${type}`);
    }
}
exports.NotificationScheduler = NotificationScheduler;
// Export singleton instance
exports.notificationScheduler = NotificationScheduler.getInstance();
