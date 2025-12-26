"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendeeServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const attendee_model_1 = require("./attendee.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const attendee_constants_1 = require("./attendee.constants");
const mongoose_1 = require("mongoose");
const ticket_model_1 = require("../ticket/ticket.model");
const payment_model_1 = require("../payment/payment.model");
const createAttendee = async (user, payload) => {
    try {
        const ticket = await ticket_model_1.Ticket.findOne({
            _id: payload.ticketId,
            attendeeId: user.authId,
        });
        if (!ticket) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Ticket not found');
        }
        if (ticket.status !== 'confirmed') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket is not confirmed');
        }
        if (ticket.paymentStatus !== 'paid') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket is not paid');
        }
        const payment = await payment_model_1.Payment.findOne({
            ticketId: payload.ticketId,
            userId: user.authId,
            status: 'succeeded',
        });
        if (!payment) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
        }
        const existingAttendee = await attendee_model_1.Attendee.findOne({
            ticketId: payload.ticketId,
        });
        if (existingAttendee) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Attendee already registered');
        }
        const attendeeData = {
            eventId: ticket.eventId,
            userId: user.authId,
            ticketId: payload.ticketId,
            paymentId: payment._id,
            specialRequirements: payload.specialRequirements,
        };
        const result = await attendee_model_1.Attendee.create(attendeeData);
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to register as attendee');
        }
        return result;
    }
    catch (error) {
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate entry found');
        }
        throw error;
    }
};
const getAllAttendees = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            $or: attendee_constants_1.attendeeSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm,
                    $options: 'i',
                },
            })),
        });
    }
    if (Object.keys(filterData).length) {
        andConditions.push({
            $and: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }
    if (user.role === 'user') {
        andConditions.push({
            userId: new mongoose_1.Types.ObjectId(user.authId),
        });
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        attendee_model_1.Attendee.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('eventId', 'title startDate locationType')
            .populate('userId', 'name email phone')
            .populate('ticketId', 'ticketType ticketNumber')
            .populate('paymentId', 'amount currency')
            .populate('checkInBy', 'name'),
        attendee_model_1.Attendee.countDocuments(whereConditions),
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
const getSingleAttendee = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Attendee ID');
    }
    const result = await attendee_model_1.Attendee.findById(id)
        .populate('eventId', 'title startDate locationType')
        .populate('userId', 'name email phone')
        .populate('ticketId', 'ticketType ticketNumber')
        .populate('paymentId', 'amount currency')
        .populate('checkInBy', 'name');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Attendee not found, please try again with valid id');
    }
    return result;
};
const updateAttendee = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Attendee ID');
    }
    const result = await attendee_model_1.Attendee.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    })
        .populate('eventId', 'title startDate locationType')
        .populate('userId', 'name email phone')
        .populate('ticketId', 'ticketType ticketNumber')
        .populate('paymentId', 'amount currency')
        .populate('checkInBy', 'name');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Attendee not found, please try again with valid id');
    }
    return result;
};
const checkInAttendee = async (user, data) => {
    let attendee;
    if (data.attendeeId) {
        attendee = await attendee_model_1.Attendee.findById(data.attendeeId);
    }
    else if (data.ticketId) {
        attendee = await attendee_model_1.Attendee.findOne({ ticketId: data.ticketId });
    }
    else if (data.qrCode) {
        const ticket = await ticket_model_1.Ticket.findOne({ qrCode: data.qrCode });
        if (ticket) {
            attendee = await attendee_model_1.Attendee.findOne({ ticketId: ticket._id });
        }
    }
    if (!attendee) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Attendee not found');
    }
    if (attendee.checkInStatus) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Attendee already checked in');
    }
    const result = await attendee_model_1.Attendee.findByIdAndUpdate(attendee._id, {
        checkInStatus: true,
        checkInTime: new Date(),
        checkInBy: user.authId,
    }, { new: true, runValidators: true })
        .populate('eventId', 'title startDate locationType')
        .populate('userId', 'name email phone')
        .populate('ticketId', 'ticketType ticketNumber')
        .populate('paymentId', 'amount currency')
        .populate('checkInBy', 'name');
    return result;
};
const deleteAttendee = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Attendee ID');
    }
    const result = await attendee_model_1.Attendee.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Attendee not found or could not be deleted');
    }
    return result;
};
const getEventAttendees = async (eventId, pagination) => {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const [result, total] = await Promise.all([
        attendee_model_1.Attendee.find({ eventId: new mongoose_1.Types.ObjectId(eventId) })
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('userId', 'name email phone')
            .populate('ticketId', 'ticketType ticketNumber')
            .populate('paymentId', 'amount currency')
            .populate('checkInBy', 'name'),
        attendee_model_1.Attendee.countDocuments({ eventId: new mongoose_1.Types.ObjectId(eventId) }),
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
const getMyAttendees = async (user, pagination) => {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const [result, total] = await Promise.all([
        attendee_model_1.Attendee.find({ userId: new mongoose_1.Types.ObjectId(user.authId) })
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('eventId', 'title startDate locationType')
            .populate('ticketId', 'ticketType ticketNumber')
            .populate('paymentId', 'amount currency')
            .populate('checkInBy', 'name'),
        attendee_model_1.Attendee.countDocuments({ userId: new mongoose_1.Types.ObjectId(user.authId) }),
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
exports.AttendeeServices = {
    createAttendee,
    getAllAttendees,
    getSingleAttendee,
    updateAttendee,
    deleteAttendee,
    checkInAttendee,
    getEventAttendees,
    getMyAttendees,
};
