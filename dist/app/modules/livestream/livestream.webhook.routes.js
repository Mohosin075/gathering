"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamWebhookRoutes = void 0;
const express_1 = __importDefault(require("express"));
const livestream_webhook_controller_1 = require("./livestream.webhook.controller");
const router = express_1.default.Router();
// Agora webhook (no auth required - secured by webhook secret)
router.post('/agora', livestream_webhook_controller_1.LiveStreamWebhookController.agoraWebhook);
exports.LiveStreamWebhookRoutes = router;
