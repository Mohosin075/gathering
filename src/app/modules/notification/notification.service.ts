import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import {
  INotification,
  INotificationFilterables,
  CreateNotificationDto,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  INotificationStats,
} from './notification.interface'
import { Notification } from './notification.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { notificationSearchableFields } from './notification.constant'
import { Types } from 'mongoose'
import { emailProvider } from './notification.providers'
import { User } from '../user/user.model'
import { Event } from '../event/event.model'
import { Ticket } from '../ticket/ticket.model'
import { Payment } from '../payment/payment.model'
import { Attendee } from '../attendee/attendee.model'
import config from '../../../config'
import { io } from '../../../server'

const createNotification = async (
  payload: CreateNotificationDto,
  sendEmail: boolean = false,
): Promise<INotification> => {
  try {
    const notificationData: any = {
      userId: payload.userId,
      title: payload.title,
      content: payload.content,
      type: payload.type,
      channel: payload.channel || NotificationChannel.IN_APP,
      priority: payload.priority,
      metadata: payload.metadata || {},
      actionUrl: payload.actionUrl,
      actionText: payload.actionText,
    }

    if (payload.scheduledAt) {
      notificationData.scheduledAt = payload.scheduledAt
      notificationData.status = NotificationStatus.PENDING
    }

    const notification = await Notification.create(notificationData)

    // Send real-time notification via socket
    if (notification.channel !== NotificationChannel.EMAIL) {
      // Emit socket event for real-time notification
      // const io = (global as any).io

      if (io) {
        io.to(notification.userId.toString()).emit('notification', {
          type: 'NEW_NOTIFICATION',
          data: notification,
        })
        console.log({ notification })
      }
    }

    // Send email if requested
    if (sendEmail && notification.channel !== NotificationChannel.IN_APP) {
      await sendNotificationEmail(notification)
    }

    return notification
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to create notification: ${error.message}`,
    )
  }
}

const sendNotificationEmail = async (
  notification: INotification,
): Promise<void> => {
  try {
    const user = await User.findById(notification.userId)
    if (!user || !user.email) {
      throw new Error('User not found or no email available')
    }

    let template: string = 'system-alert'
    let templateData: Record<string, any> = {
      userName: user.name,
      notificationTitle: notification.title,
      notificationContent: notification.content,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
    }

    // Map notification type to template and add specific data
    switch (notification.type) {
      case NotificationType.TICKET_CONFIRMATION:
        template = 'ticket-confirmation'
        if (notification.metadata?.ticketId) {
          const ticket = await Ticket.findById(
            notification.metadata.ticketId,
          ).populate('eventId', 'title startDate location venue')
          if (ticket) {
            const populatedEvent: any = (ticket as any).eventId
            templateData = {
              ...templateData,
              eventTitle: populatedEvent?.title,
              eventDate: populatedEvent?.startDate?.toLocaleDateString(),
              eventTime: populatedEvent?.startDate?.toLocaleTimeString(),
              eventLocation: populatedEvent?.location || populatedEvent?.venue,
              ticketType: (ticket as any).ticketType,
              quantity: (ticket as any).quantity,
              orderId: (ticket as any)._id,
              amount: (ticket as any).finalAmount,
              currency: (ticket as any).currency,
              qrCodeUrl: `${config.clientUrl}/api/v1/tickets/${(ticket as any)._id}/qrcode`,
            }
          }
        }
        break

      case NotificationType.EVENT_REMINDER:
        template = 'event-reminder'
        if (notification.metadata?.eventId) {
          const event = (await Event.findById(
            notification.metadata.eventId,
          ).populate('organizerId', 'name email')) as any
          if (event) {
            const timeUntilEvent = Math.floor(
              (new Date(event.startDate).getTime() - Date.now()) /
                (1000 * 60 * 60),
            )
            templateData = {
              ...templateData,
              eventTitle: event.title,
              eventStart: event.startDate.toLocaleString(),
              eventLocation: event.location || event.venue,
              eventDuration: `${event.duration} hours`,
              timeUntilEvent:
                timeUntilEvent > 24
                  ? `in ${Math.floor(timeUntilEvent / 24)} days`
                  : `in ${timeUntilEvent} hours`,
              locationInstructions: event.locationInstructions,
            }
          }
        }
        break

      case NotificationType.PAYMENT_SUCCESS:
        template = 'payment-success'
        if (notification.metadata?.paymentId) {
          const payment = await Payment.findById(
            notification.metadata.paymentId,
          )
          if (payment) {
            const event = await Event.findById(payment.eventId)
            templateData = {
              ...templateData,
              eventTitle: event?.title || 'Event',
              transactionId: payment._id,
              amount: payment.amount,
              currency: payment.currency,
              paymentMethod: payment.paymentMethod,
              paymentDate: payment.createdAt.toLocaleDateString(),
            }
          }
        }
        break

      case NotificationType.WELCOME:
        template = 'welcome'
        break

      case NotificationType.PASSWORD_RESET:
        template = 'password-reset'
        if (notification.metadata?.resetCode) {
          templateData.resetCode = notification.metadata.resetCode
          templateData.expiryMinutes = 30
        }
        break

      case NotificationType.ACCOUNT_VERIFICATION:
        template = 'account-verification'
        if (notification.metadata?.verificationToken) {
          templateData.verificationUrl = `${config.clientUrl}/verify-email?token=${notification.metadata.verificationToken}`
        }
        break

      case NotificationType.ATTENDEE_CHECKED_IN:
        template = 'attendee-checked-in'
        if (notification.metadata?.attendeeId) {
          const attendee = await Attendee.findById(
            notification.metadata.attendeeId,
          )
            .populate('eventId', 'title')
            .populate('checkInBy', 'name')
          if (attendee) {
            const eventInfo: any = (attendee as any).eventId
            const checkInByInfo: any = (attendee as any).checkInBy
            templateData = {
              ...templateData,
              eventTitle: eventInfo?.title,
              checkInTime: attendee.checkInTime?.toLocaleString(),
              checkedInBy: checkInByInfo?.name || 'Organizer',
              ticketNumber: attendee._id.toString().slice(-8).toUpperCase(),
            }
          }
        }
        break

      default:
        template = 'system-alert'
    }

    await emailProvider.sendTemplateEmail(
      user.email,
      template,
      templateData,
      notification.title,
    )

    // Update notification status
    await Notification.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    })
  } catch (error: any) {
    console.error('Failed to send notification email:', error)

    // Update notification status to failed
    await Notification.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.FAILED,
      metadata: {
        ...notification.metadata,
        emailError: error.message,
      },
    })

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send email notification: ${error.message}`,
    )
  }
}

const createNotificationForEvent = async (
  eventId: Types.ObjectId | string,
  type: NotificationType,
  title: string,
  content: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  try {
    // Get all attendees for the event
    const attendees = await Attendee.find({ eventId }).populate(
      'userId',
      'email name',
    )

    const notifications = attendees.map(attendee => ({
      userId:
        ((attendee as any).userId?._id as Types.ObjectId) || attendee.userId,
      title,
      content,
      type,
      channel: NotificationChannel.BOTH,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        ...metadata,
        eventId,
        attendeeId: attendee._id,
      },
    }))

    // Create notifications in batches
    const batchSize = 50
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      await Notification.insertMany(batch)
    }

    console.log(
      `Created ${notifications.length} notifications for event ${eventId}`,
    )
  } catch (error: any) {
    console.error('Failed to create event notifications:', error)
    throw error
  }
}

const getAllNotifications = async (
  user: JwtPayload,
  filterables: INotificationFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions: Record<string, any>[] = []

  // Search term
  if (searchTerm) {
    andConditions.push({
      $or: notificationSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  // Filter by other fields
  if (Object.keys(filterData).length) {
    const filterEntries = Object.entries(filterData)
    filterEntries.forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'startDate' || key === 'endDate') {
          // Date filtering - ensure value is string
          const dateCondition: any = {}
          if (key === 'startDate' && typeof value === 'string') {
            dateCondition.$gte = new Date(value)
          }
          if (key === 'endDate' && typeof value === 'string') {
            dateCondition.$lte = new Date(value)
          }
          if (Object.keys(dateCondition).length > 0) {
            andConditions.push({ createdAt: dateCondition })
          }
        } else if (key === 'isRead' || key === 'isArchived') {
          // Boolean filtering - convert string to boolean
          andConditions.push({ [key]: value === 'true' })
        } else {
          // Regular field filtering
          andConditions.push({ [key]: value })
        }
      }
    })
  }

  // User-specific filtering (unless admin)
  if ((user as any).role === 'user') {
    andConditions.push({
      userId: new Types.ObjectId((user as any).authId as string),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Notification.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('userId', 'name email')
      .lean(),
    Notification.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const getNotificationById = async (id: string): Promise<INotification> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid notification ID')
  }

  const result = await Notification.findById(id)
    .populate('userId', 'name email')
    .lean()

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found')
  }

  return result
}

const updateNotification = async (
  id: string,
  payload: Partial<INotification>,
  userId?: string,
): Promise<INotification> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid notification ID')
  }

  const query: any = { _id: id }
  if (userId) {
    query.userId = userId
  }

  const result = await Notification.findOneAndUpdate(
    query,
    { $set: payload },
    { new: true, runValidators: true },
  )
    .populate('userId', 'name email')
    .lean()

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found')
  }

  return result
}

const markAsRead = async (
  id: string,
  userId: string,
): Promise<INotification> => {
  const result = await Notification.findOneAndUpdate(
    { _id: id, userId },
    {
      isRead: true,
      readAt: new Date(),
      status: NotificationStatus.READ,
    },
    { new: true },
  )
    .populate('userId', 'name email')
    .lean()

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found')
  }

  return result
}

const markAllAsRead = async (
  userId: string,
): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    {
      isRead: true,
      readAt: new Date(),
      status: NotificationStatus.READ,
    },
  )

  return { modifiedCount: result.modifiedCount }
}

const archiveNotification = async (
  id: string,
  userId: string,
): Promise<INotification> => {
  const result = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isArchived: true },
    { new: true },
  )
    .populate('userId', 'name email')
    .lean()

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found')
  }

  return result
}

const deleteNotification = async (id: string): Promise<INotification> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid notification ID')
  }

  const result = await Notification.findByIdAndDelete(id).lean()

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found')
  }

  return result
}

const getNotificationStats = async (
  user: JwtPayload & { authId?: string; role?: string },
): Promise<INotificationStats> => {
  const query: any = {}

  if (user.role === 'user') {
    query.userId = user.authId
  }

  const [total, unread, byType, byChannel, byStatus] = await Promise.all([
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, isRead: false }),
    Notification.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Notification.aggregate([
      { $match: query },
      { $group: { _id: '$channel', count: { $sum: 1 } } },
    ]),
    Notification.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ])

  const stats: INotificationStats = {
    total,
    unread,
    byType: {},
    byChannel: {},
    byStatus: {},
  }

  byType.forEach(item => {
    stats.byType[item._id] = item.count
  })

  byChannel.forEach(item => {
    stats.byChannel[item._id] = item.count
  })

  byStatus.forEach(item => {
    stats.byStatus[item._id] = item.count
  })

  return stats
}

const getMyNotifications = async (
  user: JwtPayload & { authId: string },
  pagination: IPaginationOptions,
) => {
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const query = { userId: user.authId, isArchived: false }

  const [result, total] = await Promise.all([
    Notification.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean(),
    Notification.countDocuments(query),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const sendTestEmail = async (
  to: string,
  template: string,
): Promise<boolean> => {
  try {
    const user = await User.findOne({ email: to })
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
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
      qrCodeUrl:
        'https://via.placeholder.com/200x200/667eea/ffffff?text=QR+CODE',
      resetCode: 'ABC123',
      verificationUrl: `${config.clientUrl}/verify-email?token=test-token-123`,
      actionUrl: `${config.clientUrl}/dashboard`,
      actionText: 'Go to Dashboard',
    }

    await emailProvider.sendTemplateEmail(to, template, testData)
    return true
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send test email: ${error.message}`,
    )
  }
}

export const NotificationServices = {
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
}
