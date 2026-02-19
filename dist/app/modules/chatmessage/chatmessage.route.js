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
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const chatmessage_validation_1 = require("./chatmessage.validation");
const router = express_1.default.Router();
// Chat routes (Protected - requires authentication)
router.post('/:roomId/messages', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(chatmessage_validation_1.ChatmessageValidations.sendMessage), chatmessage_controller_1.ChatController.sendMessage);
router.get('/:roomId/messages', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(chatmessage_validation_1.ChatmessageValidations.getMessages), chatmessage_controller_1.ChatController.getChatMessages);
router.post('/messages/:messageId/like', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), chatmessage_controller_1.ChatController.likeMessage);
router.delete('/messages/:messageId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), chatmessage_controller_1.ChatController.deleteMessage);
router.get('/:roomId/participants', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), chatmessage_controller_1.ChatController.getChatParticipants);
exports.ChatmessageRoutes = router;
