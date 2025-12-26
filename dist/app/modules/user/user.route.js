"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const s3helper_1 = require("../../../helpers/image/s3helper");
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const user_validation_1 = require("./user.validation");
const router = express_1.default.Router();
router.get('/profile', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ORGANIZER), user_controller_1.UserController.getProfile);
router.post('/interest', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ORGANIZER), (0, validateRequest_1.default)(user_validation_1.addUserInterestSchema), user_controller_1.UserController.addUserInterest);
router.patch('/profile', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), (0, fileUploadHandler_1.default)(), async (req, res, next) => {
    var _a;
    const payload = req.body;
    try {
        const imageFiles = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (imageFiles) {
            // Take the first image only
            const imageFile = imageFiles[0];
            // Upload single image to S3
            const uploadedImageUrl = await s3helper_1.S3Helper.uploadToS3(imageFile, 'image');
            if (!uploadedImageUrl) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload image');
            }
            // Merge into req.body for Zod validation
            req.body = {
                profile: uploadedImageUrl,
                ...payload,
            };
        }
        next();
    }
    catch (error) {
        console.error({ error });
        res.status(400).json({ message: 'Failed to upload image' });
    }
}, (0, validateRequest_1.default)(user_validation_1.updateUserSchema), user_controller_1.UserController.updateProfile);
router.delete('/profile', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), user_controller_1.UserController.deleteProfile);
router
    .route('/')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllUsers);
router
    .route('/:userId')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserById)
    .delete((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteUser)
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.updateUserSchema), user_controller_1.UserController.updateUserStatus);
exports.UserRoutes = router;
