"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotifications = void 0;
const notification_model_1 = require("../app/modules/notification/notification.model");
const notification_1 = require("../enum/notification");
const sendNotifications = async (data) => {
    const result = await notification_model_1.Notification.create(data);
    //@ts-ignore
    const socketIo = global.io;
    if (socketIo) {
        if (data.receiver) {
            // Single user notification
            socketIo.emit(`getNotification::${data.receiver}`, result);
        }
        else if (data.targetAudience === notification_1.TARGET_AUDIENCE.ALL_USER) {
            // Broadcast to all users
            socketIo.emit('broadcastNotification', result);
        }
    }
    return result;
};
exports.sendNotifications = sendNotifications;
