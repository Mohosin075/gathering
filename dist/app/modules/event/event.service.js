"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const event_model_1 = require("./event.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const event_constants_1 = require("./event.constants");
const mongoose_1 = require("mongoose");
const createEvent = async (user, payload) => {
    try {
        const result = await event_model_1.Event.create({
            ...payload,
            organizerId: user.authId, // always use the logged-in user
        });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Event, please try again with valid data.');
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
const getAllEvents = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    let whereConditions = {};
    // 🔥 FIXED: Properly typed arrays
    const searchConditions = [];
    const filterConditions = [];
    // Search functionality
    if (searchTerm && searchTerm.trim() !== '') {
        searchConditions.push({
            $or: event_constants_1.eventSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm.trim(),
                    $options: 'i',
                },
            })),
        });
    }
    // Filter functionality
    if (Object.keys(filterData).length > 0) {
        Object.entries(filterData).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                filterConditions.push({ [key]: value });
            }
        });
    }
    // Combine conditions
    if (searchConditions.length > 0 && filterConditions.length > 0) {
        whereConditions = {
            $and: [...searchConditions, ...filterConditions],
        };
    }
    else if (searchConditions.length > 0) {
        whereConditions = { $and: searchConditions };
    }
    else if (filterConditions.length > 0) {
        whereConditions = { $and: filterConditions };
    }
    const [result, total] = await Promise.all([
        event_model_1.Event.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('organizerId'),
        event_model_1.Event.countDocuments(whereConditions),
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
const getMyEvents = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    let whereConditions = {};
    // 🔥 FIXED: Properly typed arrays
    const searchConditions = [];
    const filterConditions = [];
    // Search functionality
    if (searchTerm && searchTerm.trim() !== '') {
        searchConditions.push({
            $or: event_constants_1.eventSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm.trim(),
                    $options: 'i',
                },
            })),
        });
    }
    // Filter functionality
    if (Object.keys(filterData).length > 0) {
        Object.entries(filterData).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                filterConditions.push({ [key]: value });
            }
        });
    }
    // Combine conditions
    if (searchConditions.length > 0 && filterConditions.length > 0) {
        whereConditions = {
            $and: [...searchConditions, ...filterConditions],
        };
    }
    else if (searchConditions.length > 0) {
        whereConditions = { $and: searchConditions };
    }
    else if (filterConditions.length > 0) {
        whereConditions = { $and: filterConditions };
    }
    // Add organizer filter to only get current user's events
    const finalConditions = {
        ...whereConditions,
        organizerId: user.authId,
    };
    const [result, total] = await Promise.all([
        event_model_1.Event.find(finalConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('organizerId'),
        event_model_1.Event.countDocuments(finalConditions),
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
const getSingleEvent = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Event ID');
    }
    const result = await event_model_1.Event.findById(id).populate('organizerId');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested event not found, please try again with valid id');
    }
    return result;
};
const updateEvent = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Event ID');
    }
    const result = await event_model_1.Event.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    }).populate('organizerId');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested event not found, please try again with valid id');
    }
    return result;
};
const deleteEvent = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Event ID');
    }
    const result = await event_model_1.Event.findByIdAndUpdate(id, { status: 'archived' }, // soft-delete
    { new: true, runValidators: true }).populate('organizerId');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found or could not be archived, please try again with a valid ID.');
    }
    return result;
};
exports.EventServices = {
    createEvent,
    getAllEvents,
    getSingleEvent,
    updateEvent,
    deleteEvent,
    getMyEvents,
};
