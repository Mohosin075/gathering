"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const attendance_controller_1 = require("./attendance.controller");
const router = express_1.default.Router();
router.post('/:eventId/rsvp', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), attendance_controller_1.AttendanceController.handleRsvp);
router.post('/:eventId/check-in', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), attendance_controller_1.AttendanceController.handleCheckIn);
router.get('/:eventId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.ADMIN), attendance_controller_1.AttendanceController.getAttendanceStats);
exports.AttendanceRoutes = router;
