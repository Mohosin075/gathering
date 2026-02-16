"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsereventController = void 0;
const userevent_service_1 = require("./userevent.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const userevent_constants_1 = require("./userevent.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createUserevent = (0, catchAsync_1.default)(async (req, res) => {
    const usereventData = req.body;
    const result = await userevent_service_1.UsereventServices.createUserevent(req.user, usereventData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Userevent created successfully',
        data: result,
    });
});
const updateUserevent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const usereventData = req.body;
    const result = await userevent_service_1.UsereventServices.updateUserevent(id, usereventData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Userevent updated successfully',
        data: result,
    });
});
const getSingleUserevent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await userevent_service_1.UsereventServices.getSingleUserevent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Userevent retrieved successfully',
        data: result,
    });
});
const getAllUserevents = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, userevent_constants_1.usereventFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await userevent_service_1.UsereventServices.getAllUserevents(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Userevents retrieved successfully',
        data: result,
    });
});
const deleteUserevent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await userevent_service_1.UsereventServices.deleteUserevent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Userevent deleted successfully',
        data: result,
    });
});
exports.UsereventController = {
    createUserevent,
    updateUserevent,
    getSingleUserevent,
    getAllUserevents,
    deleteUserevent,
};
