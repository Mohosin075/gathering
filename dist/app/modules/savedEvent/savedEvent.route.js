"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedEventRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const savedEvent_controller_1 = require("./savedEvent.controller");
const savedEvent_validation_1 = require("./savedEvent.validation");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), savedEvent_controller_1.SavedEventController.getAllSavedEvents);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), savedEvent_controller_1.SavedEventController.getSingleSavedEvent);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), (0, validateRequest_1.default)(savedEvent_validation_1.SavedEventValidations.create), savedEvent_controller_1.SavedEventController.createSavedEvent);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), (0, validateRequest_1.default)(savedEvent_validation_1.SavedEventValidations.update), savedEvent_controller_1.SavedEventController.updateSavedEvent);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), savedEvent_controller_1.SavedEventController.deleteSavedEvent);
exports.SavedEventRoutes = router;
