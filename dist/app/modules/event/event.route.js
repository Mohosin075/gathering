"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRoutes = void 0;
const express_1 = __importDefault(require("express"));
const event_controller_1 = require("./event.controller");
const event_validation_1 = require("./event.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const processReqBody_1 = require("../../middleware/processReqBody");
const router = express_1.default.Router();
router.get('/', 
// auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
event_controller_1.EventController.getAllEvents);
router.get('/my-events', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), event_controller_1.EventController.getMyEvents);
router.get('/nearby', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER), 
// validateRequest(nearbySchema),
event_controller_1.EventController.getNearbyEvents);
router.get('/:id', 
// auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER),
event_controller_1.EventController.getSingleEvent);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(event_validation_1.EventValidations.create), event_controller_1.EventController.createEvent);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(event_validation_1.EventValidations.update), event_controller_1.EventController.updateEvent);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER), event_controller_1.EventController.deleteEvent);
exports.EventRoutes = router;
