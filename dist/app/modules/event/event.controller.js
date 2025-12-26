"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const event_service_1 = require("./event.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const event_constants_1 = require("./event.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createEvent = (0, catchAsync_1.default)(async (req, res) => {
    const eventData = req.body;
    const result = await event_service_1.EventServices.createEvent(req.user, eventData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Event created successfully',
        data: result,
    });
});
const updateEvent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const eventData = req.body;
    const result = await event_service_1.EventServices.updateEvent(id, eventData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event updated successfully',
        data: result,
    });
});
const getSingleEvent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await event_service_1.EventServices.getSingleEvent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event retrieved successfully',
        data: result,
    });
});
const getAllEvents = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, event_constants_1.eventFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await event_service_1.EventServices.getAllEvents(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Events retrieved successfully',
        data: result,
    });
});
const getMyEvents = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, event_constants_1.eventFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await event_service_1.EventServices.getMyEvents(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'My Events retrieved successfully',
        data: result,
    });
});
const deleteEvent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await event_service_1.EventServices.deleteEvent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event deleted successfully',
        data: result,
    });
});
const getNearbyEvents = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, event_constants_1.nearbyEventFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const data = {
        lat: Number(req.body.lat),
        lng: Number(req.body.lng),
        distance: Number(req.body.distance) || 1000,
        tags: req.body.tags
            ? Array.isArray(req.body.tags)
                ? req.body.tags
                : req.body.tags.split(',')
            : undefined,
    };
    const result = await event_service_1.EventServices.getNearbyEvents(req.user, filterables, pagination, data);
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Nearby events retrieved successfully',
        data: result,
    });
});
exports.EventController = {
    createEvent,
    updateEvent,
    getSingleEvent,
    getAllEvents,
    deleteEvent,
    getMyEvents,
    getNearbyEvents,
};
