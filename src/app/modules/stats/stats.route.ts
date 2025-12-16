import express, { Request, Response } from 'express'
import { EventStatsController } from './stats.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { EventStatsServices } from './stats.service'

const router = express.Router()

// GET /api/stats/admin/dashboard - Main admin dashboard stats (like the image)
router.get(
  '/admin/dashboard',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  EventStatsController.getAdminDashboardStats,
)

// GET /api/stats/admin/events - Event statistics with trend data
router.get(
  '/admin/events',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  EventStatsController.getEventStats,
)

// GET /api/stats/admin/users - User statistics with growth data
router.get(
  '/admin/users',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  EventStatsController.getUserStats,
)

// GET /api/stats/admin/revenue - Revenue statistics with trend data
router.get(
  '/admin/revenue',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  EventStatsController.getRevenueStats,
)

// GET /api/stats/admin/event-status - Event status distribution
router.get(
  '/admin/event-status',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  EventStatsController.getEventStatusStats,
)

// GET /api/stats/admin/summary - All statistics in one endpoint
router.get(
  '/admin/summary',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  EventStatsController.getAppSummary,
)

// Organizer Routes
// GET /api/stats/organizer/dashboard - Main organizer dashboard stats
router.get(
  '/organizer/dashboard',
  auth(USER_ROLES.ORGANIZER),
  EventStatsController.getOrganizerDashboardStats,
)

// GET /api/stats/organizer/events - Organizer event statistics
router.get(
  '/organizer/events',
  auth(USER_ROLES.ORGANIZER),
  EventStatsController.getOrganizerEventStats,
)

// GET /api/stats/organizer/revenue - Organizer revenue statistics
router.get(
  '/organizer/revenue',
  auth(USER_ROLES.ORGANIZER),
  EventStatsController.getOrganizerRevenueStats,
)

// GET /api/stats/organizer/event-status - Organizer event status distribution
router.get(
  '/organizer/event-status',
  auth(USER_ROLES.ORGANIZER),
  EventStatsController.getOrganizerEventStatusStats,
)

// GET /api/stats/organizer/summary - All organizer statistics
router.get(
  '/organizer/summary',
  auth(USER_ROLES.ORGANIZER),
  EventStatsController.getOrganizerAppSummary,
)

// GET /api/stats/organizer/event/:eventId - Individual event statistics
router.get(
  '/organizer/event/:eventId',
  auth(USER_ROLES.ORGANIZER),
  EventStatsController.getIndividualEventStats,
)

export const EventStatsRoutes = router
