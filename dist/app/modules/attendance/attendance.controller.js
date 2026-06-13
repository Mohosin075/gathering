"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const attendance_service_1 = require("./attendance.service");
const handleRsvp = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { eventId } = req.params;
    const { status } = req.body;
    const result = await attendance_service_1.AttendanceService.handleRsvp(user.authId, eventId, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'RSVP updated successfully',
        data: result,
    });
});
const handleCheckIn = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { eventId } = req.params;
    const { lat, lng } = req.body;
    const result = await attendance_service_1.AttendanceService.handleCheckIn(user.authId, eventId, Number(lat), Number(lng));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Checked in successfully',
        data: result,
    });
});
const getAttendanceStats = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { eventId } = req.params;
    const result = await attendance_service_1.AttendanceService.getAttendanceStats(user.authId, eventId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Attendance statistics retrieved successfully',
        data: result,
    });
});
exports.AttendanceController = {
    handleRsvp,
    handleCheckIn,
    getAttendanceStats,
};
