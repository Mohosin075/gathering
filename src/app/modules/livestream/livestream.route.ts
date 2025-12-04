import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { LiveStreamController } from './livestream.controller'
import { LiveStreamValidations } from './livestream.validation'

const router = express.Router()

// Public routes
router.get('/', LiveStreamController.getAllLiveStreams)
router.get('/:streamId', LiveStreamController.getSingleLiveStream)

// Protected routes (Organizer only for creation)
router.post(
  '/',
  auth(USER_ROLES.ORGANIZER),
  validateRequest(LiveStreamValidations.createLiveStream),
  LiveStreamController.createLiveStream,
)

// Get Agora token (Authenticated users)
router.get(
  '/:streamId/token',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.ORGANIZER,
    USER_ROLES.USER,
  ),
  LiveStreamController.getAgoraToken,
)

// Streamer's streams
router.get(
  '/my/streams',
  auth(USER_ROLES.ORGANIZER),
  LiveStreamController.getMyLiveStreams,
)

// Stream management (Organizer only)
router.patch(
  '/:streamId',
  auth(USER_ROLES.ORGANIZER),
  validateRequest(LiveStreamValidations.updateLiveStream),
  LiveStreamController.updateLiveStream,
)

router.delete(
  '/:streamId',
  auth(USER_ROLES.ORGANIZER),
  LiveStreamController.deleteLiveStream,
)

// Start/End stream
router.post(
  '/:streamId/start',
  auth(USER_ROLES.ORGANIZER),
  LiveStreamController.startLiveStream,
)

router.post(
  '/:streamId/end',
  auth(USER_ROLES.ORGANIZER),
  LiveStreamController.endLiveStream,
)

export const LiveStreamRoutes = router
