import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from './notification.interface'

export const notificationSearchableFields = ['title', 'content', 'targetAudience']

export const notificationFilterableFields = [
  'searchTerm',
  'userId',
  'targetAudience',
  'type',
  'channel',
  'status',
  'priority',
  'isRead',
  'isArchived',
  'startDate',
  'endDate',
]

export const NOTIFICATION_TEMPLATES = {
  // Event Templates
  EVENT_REMINDER: 'event-reminder',
  EVENT_CREATED: 'event-created',
  EVENT_UPDATED: 'event-updated',
  EVENT_CANCELLED: 'event-cancelled',

  // User Templates
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  ACCOUNT_VERIFICATION: 'account-verification',
  PROFILE_UPDATED: 'profile-updated',

  // System Templates
  SYSTEM_ALERT: 'system-alert',
  MAINTENANCE: 'maintenance',
  NEW_FEATURE: 'new-feature',

  // Organizer Templates
  EVENT_STATISTICS: 'event-statistics',
}

export const NOTIFICATION_CONFIG = {
  // Priority levels with default channel
  PRIORITY_CONFIG: {
    [NotificationPriority.URGENT]: {
      channel: NotificationChannel.BOTH,
      retryAttempts: 3,
    },
    [NotificationPriority.HIGH]: {
      channel: NotificationChannel.BOTH,
      retryAttempts: 2,
    },
    [NotificationPriority.MEDIUM]: {
      channel: NotificationChannel.EMAIL,
      retryAttempts: 1,
    },
    [NotificationPriority.LOW]: {
      channel: NotificationChannel.IN_APP,
      retryAttempts: 0,
    },
  },

  // Default settings
  DEFAULT_CHANNEL: NotificationChannel.IN_APP,
  DEFAULT_PRIORITY: NotificationPriority.MEDIUM,
  DEFAULT_RETRY_DELAY: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  BATCH_SIZE: 50,

  // Scheduled notification settings
  SCHEDULED_CHECK_INTERVAL: 60000, // 1 minute
  CLEANUP_ARCHIVED_AFTER_DAYS: 30,
}

export const EMAIL_SUBJECTS = {
  [NotificationType.EVENT_REMINDER]: 'Event Reminder: {eventTitle}',
  [NotificationType.EVENT_CREATED]: 'New Event Created: {eventTitle}',
  [NotificationType.EVENT_UPDATED]: 'Event Updated: {eventTitle}',
  [NotificationType.EVENT_CANCELLED]: 'Event Cancelled: {eventTitle}',
  [NotificationType.WELCOME]: 'Welcome to EventHub!',
  [NotificationType.PASSWORD_RESET]: 'Password Reset Request',
  [NotificationType.ACCOUNT_VERIFICATION]: 'Verify Your Account',
  [NotificationType.SYSTEM_ALERT]: 'System Alert',
  [NotificationType.PROMOTIONAL]: '{subject}',
}
