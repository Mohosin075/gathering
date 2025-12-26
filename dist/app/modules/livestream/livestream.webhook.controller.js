"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamWebhookController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const livestream_model_1 = require("./livestream.model");
const livestream_service_1 = require("./livestream.service");
const config_1 = __importDefault(require("../../../config"));
// Agora Webhook Handler
const agoraWebhook = (0, catchAsync_1.default)(async (req, res) => {
    const { event, channel, uid, timestamp } = req.body;
    const secret = req.headers['agora-signature'];
    // Verify Webhook Secret if configured
    if (config_1.default.agora.web_hook_secret && secret !== config_1.default.agora.web_hook_secret) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
            success: false,
            message: 'Invalid webhook signature',
        });
    }
    // Find stream by channel name
    const stream = await livestream_model_1.LiveStream.findOne({ channelName: channel }).lean();
    if (!stream) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: 'Stream not found, but webhook processed',
        });
    }
    // Handle different events
    switch (event) {
        case 'user_joined':
            await livestream_service_1.LiveStreamService.updateViewerCountToDB(stream._id.toString(), 'join');
            break;
        case 'user_left':
            await livestream_service_1.LiveStreamService.updateViewerCountToDB(stream._id.toString(), 'leave');
            break;
        case 'stream_published':
            // Stream started broadcasting
            // You might want to update stream status here
            break;
        case 'stream_unpublished':
            // Stream stopped broadcasting
            // You might want to update stream status here
            break;
        default:
            break;
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Webhook processed successfully',
    });
});
exports.LiveStreamWebhookController = {
    agoraWebhook,
};
