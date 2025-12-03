"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedEventController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const pagination_1 = require("../../../interfaces/pagination");
const savedEvent_service_1 = require("./savedEvent.service");
const savedEvent_constants_1 = require("./savedEvent.constants");
const createSavedEvent = (0, catchAsync_1.default)(async (req, res) => {
    const savedEventData = req.body;
    const result = await savedEvent_service_1.SavedEventServices.createSavedEvent(req.user, savedEventData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'SavedEvent created successfully',
        data: result,
    });
});
const updateSavedEvent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const savedEventData = req.body;
    const result = await savedEvent_service_1.SavedEventServices.updateSavedEvent(id, savedEventData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'SavedEvent updated successfully',
        data: result,
    });
});
const getSingleSavedEvent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await savedEvent_service_1.SavedEventServices.getSingleSavedEvent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'SavedEvent retrieved successfully',
        data: result,
    });
});
const getAllSavedEvents = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, savedEvent_constants_1.savedEventFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await savedEvent_service_1.SavedEventServices.getAllSavedEvents(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'SavedEvents retrieved successfully',
        data: result,
    });
});
const deleteSavedEvent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await savedEvent_service_1.SavedEventServices.deleteSavedEvent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'SavedEvent deleted successfully',
        data: result,
    });
});
exports.SavedEventController = {
    createSavedEvent,
    updateSavedEvent,
    getSingleSavedEvent,
    getAllSavedEvents,
    deleteSavedEvent,
};
