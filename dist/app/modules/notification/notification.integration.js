"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationIntegration = void 0;
const notification_service_1 = require("./notification.service");
const notification_interface_1 = require("./notification.interface");
const ticket_model_1 = require("../ticket/ticket.model");
const payment_model_1 = require("../payment/payment.model");
const event_model_1 = require("../event/event.model");
const attendee_model_1 = require("../attendee/attendee.model");
const user_model_1 = require("../user/user.model");
class NotificationIntegration {
    static async onTicketPurchase(ticketId) {
        try {
            const ticket = await ticket_model_1.Ticket.findById(ticketId)
                .populate('eventId', 'title')
                .populate('attendeeId', 'email name');
            if (!ticket || !ticket.attendeeId)
                return;
            // Create ticket confirmation notification
            await notification_service_1.NotificationServices.createNotification({
                userId: ticket.attendeeId._id,
                title: 'Ticket Purchase Confirmed',
                content: `Your ticket for "${ticket.eventId.title}" has been confirmed.`,
                type: notification_interface_1.NotificationType.TICKET_CONFIRMATION,
                channel: notification_interface_1.NotificationChannel.BOTH,
                priority: notification_interface_1.NotificationPriority.HIGH,
                metadata: {
                    ticketId: ticket._id,
                    eventId: ticket.eventId._id,
                },
                actionUrl: `${process.env.CLIENT_URL}/tickets/${ticket._id}`,
                actionText: 'View Ticket',
            }, true);
        }
        catch (error) {
            console.error('Error creating ticket purchase notification:', error);
        }
    }
    static async onPaymentSuccess(paymentId) {
        try {
            const payment = await payment_model_1.Payment.findById(paymentId)
                .populate('userId', 'email name')
                .populate('eventId', 'title');
            if (!payment)
                return;
            await notification_service_1.NotificationServices.createNotification({
                userId: payment.userId._id,
                title: 'Payment Successful',
                content: `Your payment of ${payment.amount} ${payment.currency} for "${payment.eventId.title}" was successful.`,
                type: notification_interface_1.NotificationType.PAYMENT_SUCCESS,
                channel: notification_interface_1.NotificationChannel.BOTH,
                priority: notification_interface_1.NotificationPriority.HIGH,
                metadata: {
                    paymentId: payment._id,
                    eventId: payment.eventId._id,
                },
                actionUrl: `${process.env.CLIENT_URL}/payments/${payment._id}`,
                actionText: 'View Receipt',
            }, true);
        }
        catch (error) {
            console.error('Error creating payment success notification:', error);
        }
    }
    static async onPaymentFailed(paymentId) {
        try {
            const payment = await payment_model_1.Payment.findById(paymentId)
                .populate('userId', 'email name')
                .populate('eventId', 'title');
            if (!payment)
                return;
            await notification_service_1.NotificationServices.createNotification({
                userId: payment.userId._id,
                title: 'Payment Failed',
                content: `Your payment for "${payment.eventId.title}" failed. Please try again.`,
                type: notification_interface_1.NotificationType.PAYMENT_FAILED,
                channel: notification_interface_1.NotificationChannel.BOTH,
                priority: notification_interface_1.NotificationPriority.URGENT,
                metadata: {
                    paymentId: payment._id,
                    eventId: payment.eventId._id,
                },
                actionUrl: `${process.env.CLIENT_URL}/payments/${payment._id}/retry`,
                actionText: 'Retry Payment',
            }, true);
        }
        catch (error) {
            console.error('Error creating payment failed notification:', error);
        }
    }
    static async onEventCreated(eventId) {
        try {
            const event = await event_model_1.Event.findById(eventId).populate('organizer', 'email name');
            if (!event)
                return;
            // Notify organizer
            await notification_service_1.NotificationServices.createNotification({
                userId: event.organizer._id,
                title: 'Event Published Successfully',
                content: `Your event "${event.title}" is now live and visible to attendees.`,
                type: notification_interface_1.NotificationType.EVENT_CREATED,
                channel: notification_interface_1.NotificationChannel.BOTH,
                priority: notification_interface_1.NotificationPriority.MEDIUM,
                metadata: {
                    eventId: event._id,
                },
                actionUrl: `${process.env.CLIENT_URL}/events/${event._id}`,
                actionText: 'View Event',
            }, true);
        }
        catch (error) {
            console.error('Error creating event created notification:', error);
        }
    }
    static async onEventUpdated(eventId, changes) {
        try {
            const event = await event_model_1.Event.findById(eventId);
            if (!event)
                return;
            // Get all attendees for this event
            const attendees = await attendee_model_1.Attendee.find({ eventId }).populate('userId', 'email name');
            for (const attendee of attendees) {
                await notification_service_1.NotificationServices.createNotification({
                    userId: attendee.userId._id,
                    title: 'Event Updated',
                    content: `"${event.title}" has been updated. Changes: ${changes.join(', ')}.`,
                    type: notification_interface_1.NotificationType.EVENT_UPDATED,
                    channel: notification_interface_1.NotificationChannel.BOTH,
                    priority: notification_interface_1.NotificationPriority.MEDIUM,
                    metadata: {
                        eventId: event._id,
                        attendeeId: attendee._id,
                        changes,
                    },
                    actionUrl: `${process.env.CLIENT_URL}/events/${event._id}`,
                    actionText: 'View Updates',
                }, true);
            }
        }
        catch (error) {
            console.error('Error creating event updated notification:', error);
        }
    }
    static async onAttendeeCheckIn(attendeeId, checkedInBy) {
        try {
            const attendee = await attendee_model_1.Attendee.findById(attendeeId)
                .populate('userId', 'email name')
                .populate('eventId', 'title')
                .populate('checkInBy', 'name');
            if (!attendee)
                return;
            // Notify attendee
            await notification_service_1.NotificationServices.createNotification({
                userId: attendee.userId._id,
                title: 'Checked In Successfully',
                content: `You have been checked in to "${attendee.eventId.title}".`,
                type: notification_interface_1.NotificationType.ATTENDEE_CHECKED_IN,
                channel: notification_interface_1.NotificationChannel.BOTH,
                priority: notification_interface_1.NotificationPriority.MEDIUM,
                metadata: {
                    attendeeId: attendee._id,
                    eventId: attendee.eventId._id,
                    checkedInBy: checkedInBy,
                },
                actionUrl: `${process.env.CLIENT_URL}/tickets/${attendee.ticketId}`,
                actionText: 'View Ticket',
            }, true);
            // Notify organizer (if different from check-in person)
            const event = await event_model_1.Event.findById(attendee.eventId).populate('organizer', 'email name');
            if (event && event.organizer._id.toString() !== checkedInBy.toString()) {
                await notification_service_1.NotificationServices.createNotification({
                    userId: event.organizer._id,
                    title: 'Attendee Checked In',
                    content: `${attendee.userId.name} has been checked in to "${event.title}".`,
                    type: notification_interface_1.NotificationType.ATTENDEE_CHECKED_IN,
                    channel: notification_interface_1.NotificationChannel.IN_APP,
                    priority: notification_interface_1.NotificationPriority.LOW,
                    metadata: {
                        attendeeId: attendee._id,
                        eventId: event._id,
                        checkedInBy: checkedInBy,
                    },
                });
            }
        }
        catch (error) {
            console.error('Error creating check-in notification:', error);
        }
    }
    static async onNewMessage(senderId, receiverId, message) {
        try {
            await notification_service_1.NotificationServices.createNotification({
                userId: receiverId,
                title: 'New Message',
                content: `You have a new message: "${message.substring(0, 100)}..."`,
                type: notification_interface_1.NotificationType.NEW_MESSAGE,
                channel: notification_interface_1.NotificationChannel.IN_APP,
                priority: notification_interface_1.NotificationPriority.MEDIUM,
                metadata: {
                    senderId,
                    messagePreview: message.substring(0, 100),
                },
                actionUrl: `${process.env.CLIENT_URL}/messages/${senderId}`,
                actionText: 'View Message',
            });
        }
        catch (error) {
            console.error('Error creating message notification:', error);
        }
    }
    static async sendPasswordReset(userId, resetCode) {
        try {
            const user = await user_model_1.User.findById(userId);
            if (!user)
                return;
            await notification_service_1.NotificationServices.createNotification({
                userId: user._id,
                title: 'Password Reset Request',
                content: `Use this code to reset your password: ${resetCode}`,
                type: notification_interface_1.NotificationType.PASSWORD_RESET,
                channel: notification_interface_1.NotificationChannel.EMAIL,
                priority: notification_interface_1.NotificationPriority.URGENT,
                metadata: {
                    resetCode,
                },
            }, true);
        }
        catch (error) {
            console.error('Error creating password reset notification:', error);
        }
    }
    static async sendAccountVerification(userId, verificationToken) {
        try {
            const user = await user_model_1.User.findById(userId);
            if (!user)
                return;
            await notification_service_1.NotificationServices.createNotification({
                userId: user._id,
                title: 'Verify Your Account',
                content: 'Please verify your email address to complete your registration.',
                type: notification_interface_1.NotificationType.ACCOUNT_VERIFICATION,
                channel: notification_interface_1.NotificationChannel.EMAIL,
                priority: notification_interface_1.NotificationPriority.HIGH,
                metadata: {
                    verificationToken,
                },
            }, true);
        }
        catch (error) {
            console.error('Error creating account verification notification:', error);
        }
    }
}
exports.NotificationIntegration = NotificationIntegration;
exports.default = NotificationIntegration;
