// livestream.route.ts - FIXED VERSION
import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { LiveStreamController } from './livestream.controller'
import { LiveStreamValidations } from './livestream.validation'
import { LiveStreamWebhookController } from './livestream.webhook.controller'

const router = express.Router()

// Public routes
router.get('/', LiveStreamController.getAllLiveStreams)
router.get('/event/:eventId', LiveStreamController.getLiveStreamByEventId)
router.get('/:streamId', LiveStreamController.getSingleLiveStream)

// Protected routes (Organizer only for creation)
router.post(
  '/',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  validateRequest(LiveStreamValidations.createLiveStream),
  LiveStreamController.createLiveStream,
)

// Get Agora token (Authenticated users)
router.get(
  '/:streamId/token',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  LiveStreamController.getAgoraToken,
)

// Streamer's streams
router.get(
  '/my/streams',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  LiveStreamController.getMyLiveStreams,
)

// Get stream by ticket ID
router.get(
  '/ticket/:ticketId',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  LiveStreamController.getLiveStreamByTicketId,
)

// Stream management (Streamer only)
router.patch(
  '/:streamId',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  validateRequest(LiveStreamValidations.updateLiveStream),
  LiveStreamController.updateLiveStream,
)

router.delete(
  '/:streamId',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  LiveStreamController.deleteLiveStream,
)

// Start/End stream
router.post(
  '/:streamId/start',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  LiveStreamController.startLiveStream,
)

router.post(
  '/:streamId/end',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  LiveStreamController.endLiveStream,
)

// Agora webhook (no auth required)
router.post('/webhook/agora', LiveStreamWebhookController.agoraWebhook)

export const LiveStreamRoutes = router
