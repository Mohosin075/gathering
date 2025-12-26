"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedEventServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const mongoose_1 = require("mongoose");
const savedEvent_model_1 = require("./savedEvent.model");
const savedEvent_constants_1 = require("./savedEvent.constants");
const createSavedEvent = async (user, payload) => {
    try {
        const result = await savedEvent_model_1.SavedEvent.create({ ...payload, user: user.authId });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create SavedEvent, please try again with valid data.');
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
const getAllSavedEvents = async (user, filterables, pagination) => {
    const { searchTerm, filter = 'all', ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Add user condition
    andConditions.push({ user: user.authId });
    // Search functionality (if you have searchable fields later)
    if (searchTerm && savedEvent_constants_1.savedEventSearchableFields.length > 0) {
        andConditions.push({
            $or: savedEvent_constants_1.savedEventSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm,
                    $options: 'i',
                },
            })),
        });
    }
    // Filter functionality (other filters)
    if (Object.keys(filterData).length) {
        andConditions.push({
            $and: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    // Get saved events with event population
    const savedEventsQuery = savedEvent_model_1.SavedEvent.find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .populate({
        path: 'event',
        match: filter !== 'all' ? getDateMatchCondition(filter) : {},
    });
    const savedEvents = await savedEventsQuery;
    // Filter out events that didn't match the population filter
    const filteredSavedEvents = savedEvents.filter(se => se.event !== null);
    // Get total count with the same filter (for pagination)
    let totalQuery;
    if (filter !== 'all') {
        // Need to count only events that match the date filter
        const savedEventsForCount = await savedEvent_model_1.SavedEvent.find(whereConditions).populate({
            path: 'event',
            match: getDateMatchCondition(filter),
            select: '_id',
        });
        totalQuery = savedEventsForCount.filter(se => se.event !== null).length;
    }
    else {
        totalQuery = savedEvent_model_1.SavedEvent.countDocuments(whereConditions);
    }
    const total = await totalQuery;
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: filteredSavedEvents,
    };
};
// Helper function for date filtering
const getDateMatchCondition = (filter) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    switch (filter) {
        case 'upcoming':
            return { startDate: { $gte: today } };
        case 'past':
            return { startDate: { $lt: today } };
        case 'today':
            return { startDate: today };
        default:
            return {};
    }
};
const getSingleSavedEvent = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid SavedEvent ID');
    }
    const result = await savedEvent_model_1.SavedEvent.findById(id)
        .populate('user')
        .populate('event');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested savedEvent not found, please try again with valid id');
    }
    return result;
};
const updateSavedEvent = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid SavedEvent ID');
    }
    const result = await savedEvent_model_1.SavedEvent.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    })
        .populate('user')
        .populate('event');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested savedEvent not found, please try again with valid id');
    }
    return result;
};
const deleteSavedEvent = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid SavedEvent ID');
    }
    const result = await savedEvent_model_1.SavedEvent.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting savedEvent, please try again with valid id.');
    }
    return result;
};
exports.SavedEventServices = {
    createSavedEvent,
    getAllSavedEvents,
    getSingleSavedEvent,
    updateSavedEvent,
    deleteSavedEvent,
};
