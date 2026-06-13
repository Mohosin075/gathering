"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const event_model_1 = require("../event/event.model");
const attendance_model_1 = require("./attendance.model");
const mongoose_1 = require("mongoose");
const activity_service_1 = require("../activity/activity.service");
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin(deltaLambda / 2) *
            Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
const updateEventAttendanceCounts = async (eventId) => {
    const [goingCount, interestedCount, checkedInCount] = await Promise.all([
        attendance_model_1.Attendance.countDocuments({ event: eventId, status: 'going' }),
        attendance_model_1.Attendance.countDocuments({ event: eventId, status: 'interested' }),
        attendance_model_1.Attendance.countDocuments({ event: eventId, status: 'checked-in' }),
    ]);
    await event_model_1.Event.findByIdAndUpdate(eventId, {
        $set: {
            goingCount,
            interestedCount,
            checkedInCount,
        },
    });
};
const handleRsvp = async (userId, eventId, status) => {
    if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Event ID');
    }
    const event = await event_model_1.Event.findById(eventId);
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    }
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const eventObjectId = new mongoose_1.Types.ObjectId(eventId);
    // Find existing attendance
    const existingAttendance = await attendance_model_1.Attendance.findOne({
        user: userObjectId,
        event: eventObjectId,
    });
    if (existingAttendance) {
        if (existingAttendance.status === status) {
            // Toggle off if they click the same option
            await attendance_model_1.Attendance.deleteOne({ _id: existingAttendance._id });
            await activity_service_1.ActivityServices.logActivity({
                action: 'EVENT_RSVP_REMOVE',
                description: `removed RSVP from event`,
                userId: userObjectId,
                role: 'user',
                resourceId: eventObjectId,
                resourceType: 'Event',
            });
        }
        else {
            // Change RSVP status
            existingAttendance.status = status;
            existingAttendance.rsvpAt = new Date();
            await existingAttendance.save();
            await activity_service_1.ActivityServices.logActivity({
                action: 'EVENT_RSVP',
                description: `is ${status} to event`,
                userId: userObjectId,
                role: 'user',
                resourceId: eventObjectId,
                resourceType: 'Event',
            });
        }
    }
    else {
        // Create new RSVP
        await attendance_model_1.Attendance.create({
            user: userObjectId,
            event: eventObjectId,
            status,
            rsvpAt: new Date(),
        });
        await activity_service_1.ActivityServices.logActivity({
            action: 'EVENT_RSVP',
            description: `is ${status} to event`,
            userId: userObjectId,
            role: 'user',
            resourceId: eventObjectId,
            resourceType: 'Event',
        });
    }
    // Update counts on Event
    await updateEventAttendanceCounts(eventId);
    const updatedAttendance = await attendance_model_1.Attendance.findOne({
        user: userObjectId,
        event: eventObjectId,
    });
    return {
        attendanceStatus: (updatedAttendance === null || updatedAttendance === void 0 ? void 0 : updatedAttendance.status) || null,
    };
};
const handleCheckIn = async (userId, eventId, lat, lng) => {
    var _a;
    if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Event ID');
    }
    const event = await event_model_1.Event.findById(eventId);
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    }
    if (event.locationType === 'online') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot check-in to an online event');
    }
    const eventCoords = (_a = event.location) === null || _a === void 0 ? void 0 : _a.coordinates;
    if (!eventCoords || eventCoords.length < 2) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Event does not have valid coordinates');
    }
    const eventLng = eventCoords[0];
    const eventLat = eventCoords[1];
    // Proximity check (e.g. 200 meters)
    const distance = getDistanceInMeters(lat, lng, eventLat, eventLng);
    if (distance > 200) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `You must be within 200 meters of the venue to check-in. Current distance: ${Math.round(distance)}m`);
    }
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const eventObjectId = new mongoose_1.Types.ObjectId(eventId);
    const existingAttendance = await attendance_model_1.Attendance.findOne({
        user: userObjectId,
        event: eventObjectId,
    });
    if (existingAttendance) {
        existingAttendance.status = 'checked-in';
        existingAttendance.checkedInAt = new Date();
        await existingAttendance.save();
    }
    else {
        await attendance_model_1.Attendance.create({
            user: userObjectId,
            event: eventObjectId,
            status: 'checked-in',
            checkedInAt: new Date(),
        });
    }
    await activity_service_1.ActivityServices.logActivity({
        action: 'EVENT_CHECKIN',
        description: `checked in to event`,
        userId: userObjectId,
        role: 'user',
        resourceId: eventObjectId,
        resourceType: 'Event',
    });
    await updateEventAttendanceCounts(eventId);
    return {
        success: true,
        message: 'Checked-in successfully',
    };
};
const getAttendanceStats = async (userId, eventId) => {
    if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Event ID');
    }
    const event = await event_model_1.Event.findById(eventId);
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    }
    const [goingCount, interestedCount, checkedInCount] = await Promise.all([
        attendance_model_1.Attendance.countDocuments({ event: eventId, status: 'going' }),
        attendance_model_1.Attendance.countDocuments({ event: eventId, status: 'interested' }),
        attendance_model_1.Attendance.countDocuments({ event: eventId, status: 'checked-in' }),
    ]);
    // Get active user's status
    const userAttendance = await attendance_model_1.Attendance.findOne({
        user: new mongoose_1.Types.ObjectId(userId),
        event: new mongoose_1.Types.ObjectId(eventId),
    });
    // Get list of users going/checked-in
    const participants = await attendance_model_1.Attendance.find({
        event: new mongoose_1.Types.ObjectId(eventId),
        status: { $in: ['going', 'checked-in'] },
    })
        .populate('user', 'name profile')
        .limit(10);
    return {
        goingCount,
        interestedCount,
        checkedInCount,
        currentUserStatus: (userAttendance === null || userAttendance === void 0 ? void 0 : userAttendance.status) || null,
        participants: participants.map(p => ({
            user: p.user,
            status: p.status,
        })),
    };
};
exports.AttendanceService = {
    handleRsvp,
    handleCheckIn,
    getAttendanceStats,
};
