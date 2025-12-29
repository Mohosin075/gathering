"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityServices = void 0;
const activity_model_1 = require("./activity.model");
const logActivity = async (data) => {
    try {
        const activity = await activity_model_1.Activity.create(data);
        return activity;
    }
    catch (error) {
        console.error('Failed to log activity:', error);
        // We don't want to block the main flow if logging fails, so just log error
        return null;
    }
};
const getRecentActivities = async (limit = 10) => {
    const activities = await activity_model_1.Activity.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'name email profile role')
        .populate('resourceId', 'title');
    return activities;
};
exports.ActivityServices = {
    logActivity,
    getRecentActivities,
};
