"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const livestream_service_1 = require("./livestream.service");
// Create Live Stream
const createLiveStream = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await livestream_service_1.LiveStreamService.createLiveStreamToDB(user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Live stream created successfully',
        data: result,
    });
});
// Get Agora Token
const getAgoraToken = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { streamId } = req.params;
    const { role = 'viewer' } = req.query;
    const result = await livestream_service_1.LiveStreamService.getAgoraTokenFromDB(user, streamId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Agora token generated successfully',
        data: result,
    });
});
// Get All Live Streams
const getAllLiveStreams = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const result = await livestream_service_1.LiveStreamService.getAllLiveStreamsFromDB(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        meta: result.meta,
        data: result.data,
    });
});
// Get My Live Streams
const getMyLiveStreams = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const query = req.query;
    const result = await livestream_service_1.LiveStreamService.getMyLiveStreamsFromDB(user, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        meta: result.meta,
        data: result.data,
    });
});
// Get Single Live Stream
const getSingleLiveStream = (0, catchAsync_1.default)(async (req, res) => {
    const { streamId } = req.params;
    const user = req.user;
    const result = await livestream_service_1.LiveStreamService.getSingleLiveStreamFromDB(streamId, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Live stream retrieved successfully',
        data: result,
    });
});
// Update Live Stream
const updateLiveStream = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { streamId } = req.params;
    const result = await livestream_service_1.LiveStreamService.updateLiveStreamToDB(user, streamId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Live stream updated successfully',
        data: result,
    });
});
// Delete Live Stream
const deleteLiveStream = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { streamId } = req.params;
    const result = await livestream_service_1.LiveStreamService.deleteLiveStreamToDB(user, streamId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Live stream deleted successfully',
        data: result,
    });
});
// Start Live Stream
const startLiveStream = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { streamId } = req.params;
    const result = await livestream_service_1.LiveStreamService.startLiveStreamToDB(user, streamId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Live stream started successfully',
        data: result,
    });
});
// End Live Stream
const endLiveStream = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { streamId } = req.params;
    const result = await livestream_service_1.LiveStreamService.endLiveStreamToDB(user, streamId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Live stream ended successfully',
        data: result,
    });
});
exports.LiveStreamController = {
    createLiveStream,
    getAgoraToken,
    getAllLiveStreams,
    getMyLiveStreams,
    getSingleLiveStream,
    updateLiveStream,
    deleteLiveStream,
    startLiveStream,
    endLiveStream,
};
