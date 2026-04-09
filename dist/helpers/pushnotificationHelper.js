"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const config_1 = __importDefault(require("../config"));
if (!firebase_admin_1.default.apps.length) {
    if (config_1.default.firebase_service_account_base64) {
        try {
            const serviceAccountJson = Buffer.from(config_1.default.firebase_service_account_base64, "base64").toString("utf8");
            const serviceAccount = JSON.parse(serviceAccountJson);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin initialized successfully");
        }
        catch (error) {
            console.error("Error initializing Firebase Admin:", error);
        }
    }
    else {
        console.warn("Firebase service account base64 is missing. Push notifications will not work.");
    }
}
const sendPushNotification = async (target, // deviceToken or topic
title, body, data, icon, isTopic = false) => {
    if (!firebase_admin_1.default.apps.length) {
        console.warn("Firebase Admin not initialized. Skipping push notification.");
        return;
    }
    // FCM data object only accepts strings, so we stringify any non-string values
    const formattedData = {};
    Object.keys(data).forEach((key) => {
        if (typeof data[key] === "string") {
            formattedData[key] = data[key];
        }
        else {
            formattedData[key] = JSON.stringify(data[key]);
        }
    });
    const message = {
        notification: { title, body },
        data: formattedData,
        ...(icon && {
            android: {
                notification: { icon },
            },
        }),
        apns: {
            payload: {
                aps: {
                    'mutable-content': 1,
                },
            },
        },
    };
    if (isTopic) {
        message.topic = target;
    }
    else {
        message.token = target;
    }
    try {
        const response = await firebase_admin_1.default.messaging().send(message);
        console.log(`Successfully sent message to ${isTopic ? 'topic' : 'token'}:`, response);
    }
    catch (error) {
        console.error('Error sending message:', error === null || error === void 0 ? void 0 : error.message, error);
    }
};
exports.sendPushNotification = sendPushNotification;
