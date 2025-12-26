"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const meeting_service_1 = require("./meeting.service");
const createMeeting = (0, catchAsync_1.default)(async (req, res, next) => {
    const user = req.user;
    const result = await meeting_service_1.MeetingService.createMeetingToDB(user, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Meeting created successfully',
        data: {
            id: result.roomId,
            joinLink: result.joinLink,
            meetingType: result.meetingType,
        },
    });
});
const joinMeeting = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const meetingId = req.params.meetingId;
    const data = await meeting_service_1.MeetingService.getAgoraAccessTokenFromDB(user, meetingId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Token generated successfully',
        data,
    });
});
const myMeetings = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const meetings = await meeting_service_1.MeetingService.getMyMeetingsToDB(user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Meetings fetched successfully',
        data: { meetings },
    });
});
const closeMeeting = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const meetingId = req.params.meetingId;
    const result = await meeting_service_1.MeetingService.closeMeetingToDB(user, meetingId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Meeting closed successfully',
        data: result,
    });
});
const deleteMeeting = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const meetingId = req.params.meetingId;
    const result = await meeting_service_1.MeetingService.deleteMeetingToDB(user, meetingId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Meeting deleted successfully',
        data: result,
    });
});
exports.MeetingController = {
    createMeeting,
    joinMeeting,
    myMeetings,
    closeMeeting,
    deleteMeeting,
};
