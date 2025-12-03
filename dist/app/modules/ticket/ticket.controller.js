"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const http_status_codes_1 = require("http-status-codes");
const ticket_service_1 = require("./ticket.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const pick_1 = __importDefault(require("../../../shared/pick"));
const ticket_constants_1 = require("./ticket.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createTicket = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await ticket_service_1.TicketServices.createTicket(user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Ticket created successfully',
        data: result,
    });
});
const getAllTickets = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const filters = (0, pick_1.default)(req.query, ticket_constants_1.ticketFilterableFields);
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await ticket_service_1.TicketServices.getAllTickets(user, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Tickets retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});
const getSingleTicket = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await ticket_service_1.TicketServices.getSingleTicket(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Ticket retrieved successfully',
        data: result,
    });
});
const updateTicket = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await ticket_service_1.TicketServices.updateTicket(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Ticket updated successfully',
        data: result,
    });
});
const deleteTicket = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await ticket_service_1.TicketServices.deleteTicket(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Ticket cancelled successfully',
        data: result,
    });
});
const checkInTicket = (0, catchAsync_1.default)(async (req, res) => {
    const { ticketId } = req.body;
    const result = await ticket_service_1.TicketServices.checkInTicket(ticketId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Ticket checked in successfully',
        data: result,
    });
});
const getMyTickets = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await ticket_service_1.TicketServices.getMyTickets(user, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'My tickets retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});
exports.TicketController = {
    createTicket,
    getAllTickets,
    getSingleTicket,
    updateTicket,
    deleteTicket,
    checkInTicket,
    getMyTickets,
};
