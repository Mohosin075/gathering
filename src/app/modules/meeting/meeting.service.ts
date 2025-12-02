import { StatusCodes } from 'http-status-codes'
import { JwtPayload, Secret } from 'jsonwebtoken'
import config from '../../../config'
import ApiError from '../../../errors/ApiError'
import { emailHelper } from '../../../helpers/emailHelper'
import { emailTemplate } from '../../../shared/emailTemplate'
import { User } from '../user/user.model'
import { IMeeting } from './meeting.interface'
import { Meeting } from './meeting.model'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'

const createMeetingToDB = async (
  user: JwtPayload,
  payload: {
    title?: string
    participantId: string
    meetingType: 'scheduled' | 'instant'
    startTime?: string
    endTime?: string
  },
): Promise<IMeeting> => {
  const creatorId = user.authId
  const participant = await User.findById(payload.participantId)
  if (!participant) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Participant doesn't exist!")
  }

  const roomId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const meetingDoc = await Meeting.create({
    title: payload.title,
    creator: creatorId,
    participant: participant._id,
    meetingType: payload.meetingType,
    startTime: payload.startTime ? new Date(payload.startTime) : undefined,
    endTime: payload.endTime ? new Date(payload.endTime) : undefined,
    roomId,
    joinLink: `http://${config.ip_address}:${config.port}/api/v1/meetings/join/${roomId}`,
  })

  const creator = await User.findById(creatorId)

  const details = {
    title: meetingDoc.title || 'Meeting',
    meetingType: meetingDoc.meetingType,
    startTime: meetingDoc.startTime,
    endTime: meetingDoc.endTime,
    joinLink: meetingDoc.joinLink,
  }

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

  return meetingDoc
}

const getAgoraAccessTokenFromDB = async (
  user: JwtPayload,
  meetingId: string,
) => {
  const meeting = await Meeting.findOne({ roomId: meetingId })
  if (!meeting) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Meeting not found')
  }
  const authorized =
    String(meeting.creator) === String(user.authId) ||
    String(meeting.participant) === String(user.authId)
  if (!authorized) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to join')
  }

  if (!config.agora?.app_id || !config.agora?.app_certificate) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Agora config missing',
    )
  }

  const appID = config.agora.app_id as string
  const appCertificate = config.agora.app_certificate as string
  const channelName = meeting.roomId
  const uid = 0
  const role = RtcRole.PUBLISHER
  const expireTimeInSeconds = 3600
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds
  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs,
  )
  return { token, channelName }
}

const getMyMeetingsToDB = async (user: JwtPayload) => {
  const now = new Date()
  const meetings = await Meeting.find({
    $or: [{ creator: user.authId }, { participant: user.authId }],
  })
    .populate('creator', 'name email')
    .populate('participant', 'name email')

  const mapped = meetings.map(m => {
    let status: 'upcoming' | 'ongoing' | 'completed' = 'ongoing'
    if (m.isClosed) status = 'completed'
    else if (m.meetingType === 'scheduled' && m.startTime && m.endTime) {
      if (now < m.startTime) status = 'upcoming'
      else if (now > m.endTime) status = 'completed'
      else status = 'ongoing'
    }
    return {
      creator: {
        id: String(m.creator._id),
        name: (m as any).creator.name,
        email: (m as any).creator.email,
      },
      participant: {
        id: String(m.participant._id),
        name: (m as any).participant.name,
        email: (m as any).participant.email,
      },
      meetingType: m.meetingType,
      startTime: m.startTime || null,
      endTime: m.endTime || null,
      roomId: m.roomId,
      joinLink: m.joinLink,
      status,
    }
  })

  return mapped
}

const closeMeetingToDB = async (user: JwtPayload, meetingId: string) => {
  const meeting = await Meeting.findOne({ roomId: meetingId })
  if (!meeting) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Meeting not found')
  }
  if (String(meeting.creator) !== String(user.authId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only creator can close')
  }
  const now = new Date()
  meeting.isClosed = true
  meeting.closedAt = now
  if (meeting.meetingType === 'scheduled') {
    if (!meeting.endTime || meeting.endTime > now) meeting.endTime = now
  }
  await meeting.save()
  return { roomId: meeting.roomId, closedAt: meeting.closedAt }
}

const deleteMeetingToDB = async (user: JwtPayload, meetingId: string) => {
  const meeting = await Meeting.findOne({ roomId: meetingId })
  if (!meeting) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Meeting not found')
  }
  if (String(meeting.creator) !== String(user.authId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only creator can delete')
  }
  await Meeting.deleteOne({ _id: meeting._id })
  return { roomId: meeting.roomId }
}

export const MeetingService = {
  createMeetingToDB,
  getAgoraAccessTokenFromDB,
  getMyMeetingsToDB,
  closeMeetingToDB,
  deleteMeetingToDB,
}
