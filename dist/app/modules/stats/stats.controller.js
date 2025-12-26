"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStatsController = void 0;
const stats_service_1 = require("./stats.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const getAdminDashboardStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stats_service_1.EventStatsServices.getAdminDashboardStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Admin dashboard stats fetched successfully',
        data: result,
    });
});
const getEventStats = (0, catchAsync_1.default)(async (req, res) => {
    const months = parseInt(req.query.months) || 6;
    const result = await stats_service_1.EventStatsServices.getEventStats(months);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event statistics fetched successfully',
        data: result,
    });
});
const getUserStats = (0, catchAsync_1.default)(async (req, res) => {
    const months = parseInt(req.query.months) || 6;
    const result = await stats_service_1.EventStatsServices.getUserStats(months);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User statistics fetched successfully',
        data: result,
    });
});
const getRevenueStats = (0, catchAsync_1.default)(async (req, res) => {
    const months = parseInt(req.query.months) || 6;
    const result = await stats_service_1.EventStatsServices.getRevenueStats(months);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Revenue statistics fetched successfully',
        data: result,
    });
});
const getEventStatusStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stats_service_1.EventStatsServices.getEventStatusStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event status statistics fetched successfully',
        data: result,
    });
});
const getAppSummary = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stats_service_1.EventStatsServices.getAppSummary();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'All statistics fetched successfully',
        data: result,
    });
});
const getOrganizerDashboardStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stats_service_1.EventStatsServices.getOrganizerDashboardStats(req.user.authId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Organizer dashboard stats fetched successfully',
        data: result,
    });
});
const getOrganizerEventStats = (0, catchAsync_1.default)(async (req, res) => {
    const months = parseInt(req.query.months) || 6;
    const result = await stats_service_1.EventStatsServices.getOrganizerEventStats(req.user.authId, months);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Organizer event statistics fetched successfully',
        data: result,
    });
});
const getOrganizerRevenueStats = (0, catchAsync_1.default)(async (req, res) => {
    const months = parseInt(req.query.months) || 6;
    const result = await stats_service_1.EventStatsServices.getOrganizerRevenueStats(req.user.authId, months);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Organizer revenue statistics fetched successfully',
        data: result,
    });
});
const getOrganizerEventStatusStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stats_service_1.EventStatsServices.getOrganizerEventStatusStats(req.user.authId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Organizer event status statistics fetched successfully',
        data: result,
    });
});
const getOrganizerAppSummary = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stats_service_1.EventStatsServices.getOrganizerAppSummary(req.user.authId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Organizer summary statistics fetched successfully',
        data: result,
    });
});
const getIndividualEventStats = (0, catchAsync_1.default)(async (req, res) => {
    const { eventId } = req.params;
    const days = parseInt(req.query.days) || 7;
    const result = await stats_service_1.EventStatsServices.getIndividualEventStats(eventId, days);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Individual event statistics fetched successfully',
        data: result,
    });
});
exports.EventStatsController = {
    getAdminDashboardStats,
    getEventStats,
    getUserStats,
    getRevenueStats,
    getEventStatusStats,
    getAppSummary,
    getOrganizerDashboardStats,
    getOrganizerEventStats,
    getOrganizerRevenueStats,
    getOrganizerEventStatusStats,
    getOrganizerAppSummary,
    getIndividualEventStats,
};
