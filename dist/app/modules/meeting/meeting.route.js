"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const meeting_controller_1 = require("./meeting.controller");
const meeting_validation_1 = require("./meeting.validation");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const router = express_1.default.Router();
router.post('/create-meeting', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ORGANIZER), (0, validateRequest_1.default)(meeting_validation_1.MeetingValidation.createMeetingZodSchema), meeting_controller_1.MeetingController.createMeeting);
router.get('/join/:meetingId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ORGANIZER), meeting_controller_1.MeetingController.joinMeeting);
router.get('/my-meetings', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ORGANIZER), meeting_controller_1.MeetingController.myMeetings);
router.patch('/:meetingId/close', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ORGANIZER), meeting_controller_1.MeetingController.closeMeeting);
router.delete('/:meetingId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ORGANIZER), meeting_controller_1.MeetingController.deleteMeeting);
exports.MeetingRoutes = router;
