"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStatsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const stats_controller_1 = require("./stats.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
// GET /api/stats/admin/dashboard - Main admin dashboard stats (like the image)
router.get('/admin/dashboard', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.EventStatsController.getAdminDashboardStats);
// GET /api/stats/admin/events - Event statistics with trend data
router.get('/admin/events', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.EventStatsController.getEventStats);
// GET /api/stats/admin/users - User statistics with growth data
router.get('/admin/users', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.EventStatsController.getUserStats);
// GET /api/stats/admin/revenue - Revenue statistics with trend data
router.get('/admin/revenue', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.EventStatsController.getRevenueStats);
// GET /api/stats/admin/event-status - Event status distribution
router.get('/admin/event-status', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.EventStatsController.getEventStatusStats);
// GET /api/stats/admin/summary - All statistics in one endpoint
router.get('/admin/summary', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.EventStatsController.getAppSummary);
// Organizer Routes
// GET /api/stats/organizer/dashboard - Main organizer dashboard stats
router.get('/organizer/dashboard', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), stats_controller_1.EventStatsController.getOrganizerDashboardStats);
// GET /api/stats/organizer/events - Organizer event statistics
router.get('/organizer/events', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), stats_controller_1.EventStatsController.getOrganizerEventStats);
// GET /api/stats/organizer/revenue - Organizer revenue statistics
router.get('/organizer/revenue', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), stats_controller_1.EventStatsController.getOrganizerRevenueStats);
// GET /api/stats/organizer/event-status - Organizer event status distribution
router.get('/organizer/event-status', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), stats_controller_1.EventStatsController.getOrganizerEventStatusStats);
// GET /api/stats/organizer/summary - All organizer statistics
router.get('/organizer/summary', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), stats_controller_1.EventStatsController.getOrganizerAppSummary);
// GET /api/stats/organizer/event/:eventId - Individual event statistics
router.get('/organizer/event/:eventId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), stats_controller_1.EventStatsController.getIndividualEventStats);
exports.EventStatsRoutes = router;
