"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingService = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("../user/user.model");
const meeting_model_1 = require("./meeting.model");
const agora_access_token_1 = require("agora-access-token");
const createMeetingToDB = async (user, payload) => {
    const creatorId = user.authId;
    const participant = await user_model_1.User.findById(payload.participantId);
    if (!participant) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Participant doesn't exist!");
    }
    const roomId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const meetingDoc = await meeting_model_1.Meeting.create({
        title: payload.title,
        creator: creatorId,
        participant: participant._id,
        meetingType: payload.meetingType,
        startTime: payload.startTime ? new Date(payload.startTime) : undefined,
        endTime: payload.endTime ? new Date(payload.endTime) : undefined,
        roomId,
        joinLink: `http://${config_1.default.ip_address}:${config_1.default.port}/api/v1/meetings/join/${roomId}`,
    });
    const creator = await user_model_1.User.findById(creatorId);
    const details = {
        title: meetingDoc.title || 'Meeting',
        meetingType: meetingDoc.meetingType,
        startTime: meetingDoc.startTime,
        endTime: meetingDoc.endTime,
        joinLink: meetingDoc.joinLink,
    };
    // const creatorEmail = emailTemplate.meetingInvite({
    //   to: creator!.email,
    //   title: details.title,
    //   meetingType: details.meetingType,
    //   startTime: details.startTime,
    //   endTime: details.endTime,
    //   joinLink: details.joinLink,
    //   warning: 'Only assigned users can join',
    // });
    // const participantEmail = emailTemplate.meetingInvite({
    //   to: participant.email!,
    //   title: details.title,
    //   meetingType: details.meetingType,
    //   startTime: details.startTime,
    //   endTime: details.endTime,
    //   joinLink: details.joinLink,
    //   warning: 'Only assigned users can join',
    // });
    // emailHelper.sendEmail(creatorEmail);
    // emailHelper.sendEmail(participantEmail);
    return meetingDoc;
};
const getAgoraAccessTokenFromDB = async (user, meetingId) => {
    var _a, _b;
    const meeting = await meeting_model_1.Meeting.findOne({ roomId: meetingId });
    if (!meeting) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Meeting not found');
    }
    const authorized = String(meeting.creator) === String(user.authId) ||
        String(meeting.participant) === String(user.authId);
    if (!authorized) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to join');
    }
    if (!((_a = config_1.default.agora) === null || _a === void 0 ? void 0 : _a.app_id) || !((_b = config_1.default.agora) === null || _b === void 0 ? void 0 : _b.app_certificate)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Agora config missing');
    }
    const appID = config_1.default.agora.app_id;
    const appCertificate = config_1.default.agora.app_certificate;
    const channelName = meeting.roomId;
    const uid = 0;
    const role = agora_access_token_1.RtcRole.PUBLISHER;
    const expireTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
    return { token, channelName };
};
const getMyMeetingsToDB = async (user) => {
    const now = new Date();
    const meetings = await meeting_model_1.Meeting.find({
        $or: [{ creator: user.authId }, { participant: user.authId }],
    })
        .populate('creator', 'name email')
        .populate('participant', 'name email');
    const mapped = meetings.map(m => {
        let status = 'ongoing';
        if (m.isClosed)
            status = 'completed';
        else if (m.meetingType === 'scheduled' && m.startTime && m.endTime) {
            if (now < m.startTime)
                status = 'upcoming';
            else if (now > m.endTime)
                status = 'completed';
            else
                status = 'ongoing';
        }
        return {
            creator: {
                id: String(m.creator._id),
                name: m.creator.name,
                email: m.creator.email,
            },
            participant: {
                id: String(m.participant._id),
                name: m.participant.name,
                email: m.participant.email,
            },
            meetingType: m.meetingType,
            startTime: m.startTime || null,
            endTime: m.endTime || null,
            roomId: m.roomId,
            joinLink: m.joinLink,
            status,
        };
    });
    return mapped;
};
const closeMeetingToDB = async (user, meetingId) => {
    const meeting = await meeting_model_1.Meeting.findOne({ roomId: meetingId });
    if (!meeting) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Meeting not found');
    }
    if (String(meeting.creator) !== String(user.authId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only creator can close');
    }
    const now = new Date();
    meeting.isClosed = true;
    meeting.closedAt = now;
    if (meeting.meetingType === 'scheduled') {
        if (!meeting.endTime || meeting.endTime > now)
            meeting.endTime = now;
    }
    await meeting.save();
    return { roomId: meeting.roomId, closedAt: meeting.closedAt };
};
const deleteMeetingToDB = async (user, meetingId) => {
    const meeting = await meeting_model_1.Meeting.findOne({ roomId: meetingId });
    if (!meeting) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Meeting not found');
    }
    if (String(meeting.creator) !== String(user.authId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only creator can delete');
    }
    await meeting_model_1.Meeting.deleteOne({ _id: meeting._id });
    return { roomId: meeting.roomId };
};
exports.MeetingService = {
    createMeetingToDB,
    getAgoraAccessTokenFromDB,
    getMyMeetingsToDB,
    closeMeetingToDB,
    deleteMeetingToDB,
};
