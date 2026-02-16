"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsereventServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const userevent_model_1 = require("./userevent.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const userevent_constants_1 = require("./userevent.constants");
const mongoose_1 = require("mongoose");
const createUserevent = async (user, payload) => {
    console.log({ user });
    try {
        const result = await userevent_model_1.Userevent.create({ ...payload, createdBy: user.authId });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Userevent, please try again with valid data.');
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
const getAllUserevents = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: userevent_constants_1.usereventSearchableFields.map((field) => ({
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
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        userevent_model_1.Userevent
            .find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder }).populate({ path: 'createdBy', select: 'name email' }),
        userevent_model_1.Userevent.countDocuments(whereConditions),
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
const getSingleUserevent = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Userevent ID');
    }
    const result = await userevent_model_1.Userevent.findById(id).populate('venueId').populate('createdBy');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested userevent not found, please try again with valid id');
    }
    return result;
};
const updateUserevent = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Userevent ID');
    }
    const result = await userevent_model_1.Userevent.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    }).populate('venueId').populate('createdBy');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested userevent not found, please try again with valid id');
    }
    return result;
};
const deleteUserevent = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Userevent ID');
    }
    const result = await userevent_model_1.Userevent.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting userevent, please try again with valid id.');
    }
    return result;
};
exports.UsereventServices = {
    createUserevent,
    getAllUserevents,
    getSingleUserevent,
    updateUserevent,
    deleteUserevent,
};
