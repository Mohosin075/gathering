import { Types } from 'mongoose'
import { NotificationServices } from './notification.service'
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from './notification.interface'
import { Ticket } from '../ticket/ticket.model'
import { Payment } from '../payment/payment.model'
import { Event } from '../event/event.model'
import { Attendee } from '../attendee/attendee.model'
import { User } from '../user/user.model'

export class NotificationIntegration {
  static async onTicketPurchase(
    ticketId: Types.ObjectId | string,
  ): Promise<void> {
    try {
      const ticket = await Ticket.findById(ticketId)
        .populate('eventId', 'title')
        .populate('attendeeId', 'email name')

      if (!ticket || !ticket.attendeeId) return

      // Create ticket confirmation notification
      await NotificationServices.createNotification(
        {
          userId: ticket.attendeeId._id,
          title: 'Ticket Purchase Confirmed',
          content: `Your ticket for "${ticket.eventId.title}" has been confirmed.`,
          type: NotificationType.TICKET_CONFIRMATION,
          channel: NotificationChannel.BOTH,
          priority: NotificationPriority.HIGH,
          metadata: {
            ticketId: ticket._id,
            eventId: ticket.eventId._id,
          },
          actionUrl: `${process.env.CLIENT_URL}/tickets/${ticket._id}`,
          actionText: 'View Ticket',
        },
        true,
      )
    } catch (error) {
      console.error('Error creating ticket purchase notification:', error)
    }
  }

  static async onPaymentSuccess(
    paymentId: Types.ObjectId | string,
  ): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('userId', 'email name')
        .populate('eventId', 'title')

      if (!payment) return

      await NotificationServices.createNotification(
        {
          userId: payment.userId._id,
          title: 'Payment Successful',
          content: `Your payment of ${payment.amount} ${payment.currency} for "${payment.eventId.title}" was successful.`,
          type: NotificationType.PAYMENT_SUCCESS,
          channel: NotificationChannel.BOTH,
          priority: NotificationPriority.HIGH,
          metadata: {
            paymentId: payment._id,
            eventId: payment.eventId._id,
          },
          actionUrl: `${process.env.CLIENT_URL}/payments/${payment._id}`,
          actionText: 'View Receipt',
        },
        true,
      )
    } catch (error) {
      console.error('Error creating payment success notification:', error)
    }
  }

  static async onPaymentFailed(
    paymentId: Types.ObjectId | string,
  ): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('userId', 'email name')
        .populate('eventId', 'title')

      if (!payment) return

      await NotificationServices.createNotification(
        {
          userId: payment.userId._id,
          title: 'Payment Failed',
          content: `Your payment for "${payment.eventId.title}" failed. Please try again.`,
          type: NotificationType.PAYMENT_FAILED,
          channel: NotificationChannel.BOTH,
          priority: NotificationPriority.URGENT,
          metadata: {
            paymentId: payment._id,
            eventId: payment.eventId._id,
          },
          actionUrl: `${process.env.CLIENT_URL}/payments/${payment._id}/retry`,
          actionText: 'Retry Payment',
        },
        true,
      )
    } catch (error) {
      console.error('Error creating payment failed notification:', error)
    }
  }

  static async onEventCreated(eventId: Types.ObjectId | string): Promise<void> {
    try {
      const event = await Event.findById(eventId).populate(
        'organizerId',
        'email name',
      )

      if (!event) return

      // Notify organizer
      await NotificationServices.createNotification(
        {
          userId: (event as any).organizerId?._id || (event as any).organizerId,
          title: 'Event Published Successfully',
          content: `Your event "${event.title}" is now live and visible to attendees.`,
          type: NotificationType.EVENT_CREATED,
          channel: NotificationChannel.BOTH,
          priority: NotificationPriority.MEDIUM,
          metadata: {
            eventId: event._id,
          },
          actionUrl: `${process.env.CLIENT_URL}/events/${event._id}`,
          actionText: 'View Event',
        },
        true,
      )
    } catch (error) {
      console.error('Error creating event created notification:', error)
    }
  }

  static async onEventUpdated(
    eventId: Types.ObjectId | string,
    changes: string[],
  ): Promise<void> {
    try {
      const event = await Event.findById(eventId)
      if (!event) return

      // Get all attendees for this event
      const attendees = await Attendee.find({ eventId }).populate(
        'userId',
        'email name',
      )

      for (const attendee of attendees) {
        await NotificationServices.createNotification(
          {
            userId: attendee.userId._id,
            title: 'Event Updated',
            content: `"${event.title}" has been updated. Changes: ${changes.join(', ')}.`,
            type: NotificationType.EVENT_UPDATED,
            channel: NotificationChannel.BOTH,
            priority: NotificationPriority.MEDIUM,
            metadata: {
              eventId: event._id,
              attendeeId: attendee._id,
              changes,
            },
            actionUrl: `${process.env.CLIENT_URL}/events/${event._id}`,
            actionText: 'View Updates',
          },
          true,
        )
      }
    } catch (error) {
      console.error('Error creating event updated notification:', error)
    }
  }

  static async onAttendeeCheckIn(
    attendeeId: Types.ObjectId | string,
    checkedInBy: Types.ObjectId,
  ): Promise<void> {
    try {
      const attendee = await Attendee.findById(attendeeId)
        .populate('userId', 'email name')
        .populate('eventId', 'title')
        .populate('checkInBy', 'name')

      if (!attendee) return

      // Notify attendee
      await NotificationServices.createNotification(
        {
          userId: attendee.userId._id,
          title: 'Checked In Successfully',
          content: `You have been checked in to "${attendee.eventId.title}".`,
          type: NotificationType.ATTENDEE_CHECKED_IN,
          channel: NotificationChannel.BOTH,
          priority: NotificationPriority.MEDIUM,
          metadata: {
            attendeeId: attendee._id,
            eventId:
              (attendee as any).eventId?._id || (attendee as any).eventId,
            checkedInBy: checkedInBy,
          },
          actionUrl: `${process.env.CLIENT_URL}/tickets/${attendee.ticketId}`,
          actionText: 'View Ticket',
        },
        true,
      )

      const event = await Event.findById(
        (attendee as any).eventId?._id || (attendee as any).eventId,
      ).populate('organizerId', 'email name')

      if (
        event &&
        (event as any).organizerId &&
        (event as any).organizerId._id.toString() !== checkedInBy.toString()
      ) {
        await NotificationServices.createNotification({
          userId: (event as any).organizerId._id,
          title: 'Attendee Checked In',
          content: `${(attendee as any).userId?.name} has been checked in to "${event.title}".`,
          type: NotificationType.ATTENDEE_CHECKED_IN,
          channel: NotificationChannel.IN_APP,
          priority: NotificationPriority.LOW,
          metadata: {
            attendeeId: attendee._id,
            eventId: event._id,
            checkedInBy: checkedInBy,
          },
        })
      }
    } catch (error) {
      console.error('Error creating check-in notification:', error)
    }
  }

  static async onNewMessage(
    senderId: Types.ObjectId,
    receiverId: Types.ObjectId,
    message: string,
  ): Promise<void> {
    try {
      await NotificationServices.createNotification({
        userId: receiverId,
        title: 'New Message',
        content: `You have a new message: "${message.substring(0, 100)}..."`,
        type: NotificationType.NEW_MESSAGE,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          senderId,
          messagePreview: message.substring(0, 100),
        },
        actionUrl: `${process.env.CLIENT_URL}/messages/${senderId}`,
        actionText: 'View Message',
      })
    } catch (error) {
      console.error('Error creating message notification:', error)
    }
  }

  static async sendPasswordReset(
    userId: Types.ObjectId,
    resetCode: string,
  ): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      await NotificationServices.createNotification(
        {
          userId: user._id,
          title: 'Password Reset Request',
          content: `Use this code to reset your password: ${resetCode}`,
          type: NotificationType.PASSWORD_RESET,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.URGENT,
          metadata: {
            resetCode,
          },
        },
        true,
      )
    } catch (error) {
      console.error('Error creating password reset notification:', error)
    }
  }

  static async sendAccountVerification(
    userId: Types.ObjectId,
    verificationToken: string,
  ): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      await NotificationServices.createNotification(
        {
          userId: user._id,
          title: 'Verify Your Account',
          content:
            'Please verify your email address to complete your registration.',
          type: NotificationType.ACCOUNT_VERIFICATION,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.HIGH,
          metadata: {
            verificationToken,
          },
        },
        true,
      )
    } catch (error) {
      console.error('Error creating account verification notification:', error)
    }
  }
}

export default NotificationIntegration
