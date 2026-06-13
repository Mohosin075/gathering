import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Event } from '../event/event.model'
import { Attendance } from './attendance.model'
import { Types } from 'mongoose'
import { ActivityServices } from '../activity/activity.service'

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

const updateEventAttendanceCounts = async (eventId: string) => {
  const [goingCount, interestedCount, checkedInCount] = await Promise.all([
    Attendance.countDocuments({ event: eventId, status: 'going' }),
    Attendance.countDocuments({ event: eventId, status: 'interested' }),
    Attendance.countDocuments({ event: eventId, status: 'checked-in' }),
  ])

  await Event.findByIdAndUpdate(eventId, {
    $set: {
      goingCount,
      interestedCount,
      checkedInCount,
    },
  })
}

const handleRsvp = async (
  userId: string,
  eventId: string,
  status: 'going' | 'interested',
) => {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID')
  }

  const event = await Event.findById(eventId)
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found')
  }

  const userObjectId = new Types.ObjectId(userId)
  const eventObjectId = new Types.ObjectId(eventId)

  // Find existing attendance
  const existingAttendance = await Attendance.findOne({
    user: userObjectId,
    event: eventObjectId,
  })

  if (existingAttendance) {
    if (existingAttendance.status === status) {
      // Toggle off if they click the same option
      await Attendance.deleteOne({ _id: existingAttendance._id })

      await ActivityServices.logActivity({
        action: 'EVENT_RSVP_REMOVE',
        description: `removed RSVP from event`,
        userId: userObjectId,
        role: 'user',
        resourceId: eventObjectId,
        resourceType: 'Event',
      })
    } else {
      // Change RSVP status
      existingAttendance.status = status
      existingAttendance.rsvpAt = new Date()
      await existingAttendance.save()

      await ActivityServices.logActivity({
        action: 'EVENT_RSVP',
        description: `is ${status} to event`,
        userId: userObjectId,
        role: 'user',
        resourceId: eventObjectId,
        resourceType: 'Event',
      })
    }
  } else {
    // Create new RSVP
    await Attendance.create({
      user: userObjectId,
      event: eventObjectId,
      status,
      rsvpAt: new Date(),
    })

    await ActivityServices.logActivity({
      action: 'EVENT_RSVP',
      description: `is ${status} to event`,
      userId: userObjectId,
      role: 'user',
      resourceId: eventObjectId,
      resourceType: 'Event',
    })
  }

  // Update counts on Event
  await updateEventAttendanceCounts(eventId)

  const updatedAttendance = await Attendance.findOne({
    user: userObjectId,
    event: eventObjectId,
  })

  return {
    attendanceStatus: updatedAttendance?.status || null,
  }
}

const handleCheckIn = async (
  userId: string,
  eventId: string,
  lat: number,
  lng: number,
) => {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID')
  }

  const event = await Event.findById(eventId)
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found')
  }

  if (event.locationType === 'online') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot check-in to an online event',
    )
  }

  const eventCoords = event.location?.coordinates
  if (!eventCoords || eventCoords.length < 2) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Event does not have valid coordinates',
    )
  }

  const eventLng = eventCoords[0]
  const eventLat = eventCoords[1]

  // Proximity check (e.g. 200 meters)
  const distance = getDistanceInMeters(lat, lng, eventLat, eventLng)
  if (distance > 200) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `You must be within 200 meters of the venue to check-in. Current distance: ${Math.round(distance)}m`,
    )
  }

  const userObjectId = new Types.ObjectId(userId)
  const eventObjectId = new Types.ObjectId(eventId)

  const existingAttendance = await Attendance.findOne({
    user: userObjectId,
    event: eventObjectId,
  })

  if (existingAttendance) {
    existingAttendance.status = 'checked-in'
    existingAttendance.checkedInAt = new Date()
    await existingAttendance.save()
  } else {
    await Attendance.create({
      user: userObjectId,
      event: eventObjectId,
      status: 'checked-in',
      checkedInAt: new Date(),
    })
  }

  await ActivityServices.logActivity({
    action: 'EVENT_CHECKIN',
    description: `checked in to event`,
    userId: userObjectId,
    role: 'user',
    resourceId: eventObjectId,
    resourceType: 'Event',
  })

  await updateEventAttendanceCounts(eventId)

  return {
    success: true,
    message: 'Checked-in successfully',
  }
}

const getAttendanceStats = async (userId: string, eventId: string) => {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Event ID')
  }

  const event = await Event.findById(eventId)
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found')
  }

  const [goingCount, interestedCount, checkedInCount] = await Promise.all([
    Attendance.countDocuments({ event: eventId, status: 'going' }),
    Attendance.countDocuments({ event: eventId, status: 'interested' }),
    Attendance.countDocuments({ event: eventId, status: 'checked-in' }),
  ])

  // Get active user's status
  const userAttendance = await Attendance.findOne({
    user: new Types.ObjectId(userId),
    event: new Types.ObjectId(eventId),
  })

  // Get list of users going/checked-in
  const participants = await Attendance.find({
    event: new Types.ObjectId(eventId),
    status: { $in: ['going', 'checked-in'] },
  })
    .populate('user', 'name profile')
    .limit(10)

  return {
    goingCount,
    interestedCount,
    checkedInCount,
    currentUserStatus: userAttendance?.status || null,
    participants: participants.map(p => ({
      user: p.user,
      status: p.status,
    })),
  }
}

export const AttendanceService = {
  handleRsvp,
  handleCheckIn,
  getAttendanceStats,
}
