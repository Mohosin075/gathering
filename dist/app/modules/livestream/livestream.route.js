"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamRoutes = void 0;
// livestream.route.ts - FIXED VERSION
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const livestream_controller_1 = require("./livestream.controller");
const livestream_validation_1 = require("./livestream.validation");
const livestream_webhook_controller_1 = require("./livestream.webhook.controller");
const router = express_1.default.Router();
// Public routes
router.get('/', livestream_controller_1.LiveStreamController.getAllLiveStreams);
router.get('/event/:eventId', livestream_controller_1.LiveStreamController.getLiveStreamByEventId);
router.get('/:streamId', livestream_controller_1.LiveStreamController.getSingleLiveStream);
// Protected routes (Organizer only for creation)
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(livestream_validation_1.LiveStreamValidations.createLiveStream), livestream_controller_1.LiveStreamController.createLiveStream);
// Get Agora token (Authenticated users)
router.get('/:streamId/token', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), livestream_controller_1.LiveStreamController.getAgoraToken);
// Streamer's streams
router.get('/my/streams', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), livestream_controller_1.LiveStreamController.getMyLiveStreams);
// Get stream by ticket ID
router.get('/ticket/:ticketId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), livestream_controller_1.LiveStreamController.getLiveStreamByTicketId);
// Stream management (Streamer only)
router.patch('/:streamId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(livestream_validation_1.LiveStreamValidations.updateLiveStream), livestream_controller_1.LiveStreamController.updateLiveStream);
router.delete('/:streamId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), livestream_controller_1.LiveStreamController.deleteLiveStream);
// Start/End stream
router.post('/:streamId/start', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), livestream_controller_1.LiveStreamController.startLiveStream);
router.post('/:streamId/end', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), livestream_controller_1.LiveStreamController.endLiveStream);
// Agora webhook (no auth required)
router.post('/webhook/agora', livestream_webhook_controller_1.LiveStreamWebhookController.agoraWebhook);
exports.LiveStreamRoutes = router;
