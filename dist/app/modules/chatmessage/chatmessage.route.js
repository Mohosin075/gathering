"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatmessageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const chatmessage_controller_1 = require("./chatmessage.controller");
const router = express_1.default.Router();
// Chat routes (Protected - requires authentication)
router.post('/:streamId/messages', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), chatmessage_controller_1.ChatController.sendMessage);
router.get('/:streamId/messages', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), chatmessage_controller_1.ChatController.getChatMessages);
router.post('/messages/:messageId/like', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), chatmessage_controller_1.ChatController.likeMessage);
router.delete('/messages/:messageId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), chatmessage_controller_1.ChatController.deleteMessage);
router.get('/:streamId/participants', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), chatmessage_controller_1.ChatController.getChatParticipants);
exports.ChatmessageRoutes = router;
