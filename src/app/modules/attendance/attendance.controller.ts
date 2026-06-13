import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { AttendanceService } from './attendance.service'
import { JwtPayload } from 'jsonwebtoken'

const handleRsvp = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { eventId } = req.params
  const { status } = req.body

  const result = await AttendanceService.handleRsvp(user.authId, eventId, status)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'RSVP updated successfully',
    data: result,
  })
})

const handleCheckIn = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { eventId } = req.params
  const { lat, lng } = req.body

  const result = await AttendanceService.handleCheckIn(
    user.authId,
    eventId,
    Number(lat),
    Number(lng),
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Checked in successfully',
    data: result,
  })
})

const getAttendanceStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { eventId } = req.params

  const result = await AttendanceService.getAttendanceStats(
    user.authId,
    eventId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Attendance statistics retrieved successfully',
    data: result,
  })
})

export const AttendanceController = {
  handleRsvp,
  handleCheckIn,
  getAttendanceStats,
}
