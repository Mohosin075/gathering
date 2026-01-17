"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_route_1 = require("../app/modules/user/user.route");
const auth_route_1 = require("../app/modules/auth/auth.route");
const express_1 = __importDefault(require("express"));
const public_route_1 = require("../app/modules/public/public.route");
const support_route_1 = require("../app/modules/support/support.route");
const upload_route_1 = require("../app/modules/upload/upload.route");
const event_route_1 = require("../app/modules/event/event.route");
const promotion_route_1 = require("../app/modules/promotion/promotion.route");
const ticket_route_1 = require("../app/modules/ticket/ticket.route");
const payment_route_1 = require("../app/modules/payment/payment.route");
const notification_routes_1 = require("../app/modules/notification/notification.routes");
const message_routes_1 = require("../app/modules/message/message.routes");
const chat_routes_1 = require("../app/modules/chat/chat.routes");
const review_route_1 = require("../app/modules/review/review.route");
const savedEvent_route_1 = require("../app/modules/savedEvent/savedEvent.route");
const attendee_route_1 = require("../app/modules/attendee/attendee.route");
const meeting_route_1 = require("../app/modules/meeting/meeting.route");
const livestream_route_1 = require("../app/modules/livestream/livestream.route");
const chatmessage_route_1 = require("../app/modules/chatmessage/chatmessage.route");
const follow_route_1 = require("../app/modules/follow/follow.route");
const stats_route_1 = require("../app/modules/stats/stats.route");
const livestream_webhook_routes_1 = require("../app/modules/livestream/livestream.webhook.routes");
const router = express_1.default.Router();
const apiRoutes = [
    { path: '/user', route: user_route_1.UserRoutes },
    { path: '/auth', route: auth_route_1.AuthRoutes },
    { path: '/notifications', route: notification_routes_1.NotificationRoutes },
    { path: '/public', route: public_route_1.PublicRoutes },
    { path: '/support', route: support_route_1.SupportRoutes },
    { path: '/upload', route: upload_route_1.UploadRoutes },
    { path: '/event', route: event_route_1.EventRoutes },
    { path: '/promotion', route: promotion_route_1.PromotionRoutes },
    { path: '/ticket', route: ticket_route_1.TicketRoutes },
    { path: '/payment', route: payment_route_1.PaymentRoutes },
    { path: '/message', route: message_routes_1.MessageRoutes },
    { path: '/chat', route: chat_routes_1.ChatRoutes },
    { path: '/stats', route: stats_route_1.EventStatsRoutes },
    { path: '/review', route: review_route_1.ReviewRoutes },
    { path: '/saved', route: savedEvent_route_1.SavedEventRoutes },
    { path: '/attendee', route: attendee_route_1.AttendeeRoutes },
    { path: '/meetings', route: meeting_route_1.MeetingRoutes },
    { path: '/livestream', route: livestream_route_1.LiveStreamRoutes },
    { path: '/livestream/webhook', route: livestream_webhook_routes_1.LiveStreamWebhookRoutes },
    { path: '/chatmessage', route: chatmessage_route_1.ChatmessageRoutes },
    { path: '/follow', route: follow_route_1.FollowRoutes },
];
apiRoutes.forEach(route => {
    router.use(route.path, route.route);
});
exports.default = router;
