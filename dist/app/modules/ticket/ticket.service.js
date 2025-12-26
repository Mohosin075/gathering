"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const ticket_model_1 = require("./ticket.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const ticket_constants_1 = require("./ticket.constants");
const mongoose_1 = require("mongoose");
const event_model_1 = require("../event/event.model");
const promotion_model_1 = require("../promotion/promotion.model");
const generateTicketNumber = () => {
    return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
const generateQRCode = () => {
    return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
const createTicket = async (user, payload) => {
    try {
        // Verify event exists
        const event = await event_model_1.Event.findById(payload.eventId);
        if (!event) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
        }
        // Check event capacity
        if (event.ticketsSold + payload.quantity > event.capacity) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Event capacity exceeded');
        }
        let discountAmount = 0;
        let finalAmount = payload.price * payload.quantity;
        // Apply promotion if provided
        if (payload.promotionCode) {
            const promotion = await promotion_model_1.Promotion.findByCode(payload.promotionCode);
            if (promotion && promotion.isValid()) {
                if (promotion.canUse(user.authId)) {
                    if (promotion.discountType === 'percentage') {
                        discountAmount = (finalAmount * promotion.discountValue) / 100;
                    }
                    else {
                        discountAmount = promotion.discountValue;
                    }
                    finalAmount = Math.max(0, finalAmount - discountAmount);
                    // Mark promotion as used
                    await promotion.markAsUsed(user.authId);
                }
            }
        }
        const ticketData = {
            ...payload,
            attendeeId: user.authId,
            totalAmount: payload.price * payload.quantity,
            discountAmount,
            finalAmount,
            qrCode: generateQRCode(),
            ticketNumber: generateTicketNumber(),
        };
        const result = await ticket_model_1.Ticket.create(ticketData);
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create ticket, please try again with valid data.');
        }
        // Update event tickets sold count
        await event_model_1.Event.findByIdAndUpdate(payload.eventId, {
            $inc: { ticketsSold: payload.quantity },
        });
        return result;
    }
    catch (error) {
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate ticket found');
        }
        throw error;
    }
};
const getAllTickets = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: ticket_constants_1.ticketSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm,
                    $options: 'i',
                },
            })),
        });
    }
    // Filter functionality
    if (Object.keys(filterData).length) {
        andConditions.push({
            $and: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }
    // Regular users can only see their own tickets
    if (user.role === 'user' || user.role === 'organizer') {
        andConditions.push({
            attendeeId: new mongoose_1.Types.ObjectId(user.authId),
        });
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        ticket_model_1.Ticket.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('eventId')
            .populate('attendeeId', 'name email'),
        ticket_model_1.Ticket.countDocuments(whereConditions),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const getSingleTicket = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Ticket ID');
    }
    const result = await ticket_model_1.Ticket.findById(id)
        .populate('eventId')
        .populate('attendeeId', 'name email');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested ticket not found, please try again with valid id');
    }
    return result;
};
const updateTicket = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Ticket ID');
    }
    const result = await ticket_model_1.Ticket.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    })
        .populate('eventId')
        .populate('attendeeId', 'name email');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested ticket not found, please try again with valid id');
    }
    return result;
};
const deleteTicket = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Ticket ID');
    }
    const result = await ticket_model_1.Ticket.findByIdAndUpdate(id, { status: 'cancelled' }, // soft-delete
    { new: true, runValidators: true })
        .populate('eventId')
        .populate('attendeeId', 'name email');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Ticket not found or could not be cancelled, please try again with a valid ID.');
    }
    // Update event tickets sold count
    await event_model_1.Event.findByIdAndUpdate(result.eventId, {
        $inc: { ticketsSold: -result.quantity },
    });
    return result;
};
const checkInTicket = async (ticketId) => {
    const ticket = await ticket_model_1.Ticket.findOne({ _id: ticketId })
        .populate('eventId')
        .populate('attendeeId', 'name email');
    if (!ticket) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Invalid QR code');
    }
    if (ticket.checkedIn) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket already checked in');
    }
    if (ticket.status !== 'confirmed') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket is not confirmed');
    }
    if (ticket.paymentStatus !== 'paid') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket is not paid');
    }
    const result = await ticket_model_1.Ticket.findByIdAndUpdate(ticket._id, {
        checkedIn: true,
        checkedInAt: new Date(),
    }, { new: true, runValidators: true })
        .populate('eventId')
        .populate('attendeeId', 'name email');
    return result;
};
const getMyTickets = async (user, pagination) => {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const [result, total] = await Promise.all([
        ticket_model_1.Ticket.find({ attendeeId: new mongoose_1.Types.ObjectId(user.authId) })
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('eventId')
            .populate('attendeeId', 'name email'),
        ticket_model_1.Ticket.countDocuments({ attendeeId: new mongoose_1.Types.ObjectId(user.authId) }),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
exports.TicketServices = {
    createTicket,
    getAllTickets,
    getSingleTicket,
    updateTicket,
    deleteTicket,
    checkInTicket,
    getMyTickets,
};
