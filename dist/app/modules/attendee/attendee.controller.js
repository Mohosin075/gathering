"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendeeController = void 0;
const http_status_codes_1 = require("http-status-codes");
const attendee_service_1 = require("./attendee.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const pick_1 = __importDefault(require("../../../shared/pick"));
const attendee_constants_1 = require("./attendee.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createAttendee = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await attendee_service_1.AttendeeServices.createAttendee(user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Registered as attendee successfully',
        data: result,
    });
});
const getAllAttendees = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const filters = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const paginationOptions = (0, pick_1.default)(req.query, attendee_constants_1.attendeeFilterableFields);
    const result = await attendee_service_1.AttendeeServices.getAllAttendees(user, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Attendees retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});
const getSingleAttendee = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await attendee_service_1.AttendeeServices.getSingleAttendee(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Attendee retrieved successfully',
        data: result,
    });
});
const updateAttendee = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await attendee_service_1.AttendeeServices.updateAttendee(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Attendee updated successfully',
        data: result,
    });
});
const deleteAttendee = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await attendee_service_1.AttendeeServices.deleteAttendee(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Attendee deleted successfully',
        data: result,
    });
});
const checkInAttendee = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await attendee_service_1.AttendeeServices.checkInAttendee(user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Attendee checked in successfully',
        data: result,
    });
});
const getEventAttendees = (0, catchAsync_1.default)(async (req, res) => {
    const { eventId } = req.params;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await attendee_service_1.AttendeeServices.getEventAttendees(eventId, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event attendees retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});
const getMyAttendees = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await attendee_service_1.AttendeeServices.getMyAttendees(user, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'My attendees retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});
exports.AttendeeController = {
    createAttendee,
    getAllAttendees,
    getSingleAttendee,
    updateAttendee,
    deleteAttendee,
    checkInAttendee,
    getEventAttendees,
    getMyAttendees,
};
