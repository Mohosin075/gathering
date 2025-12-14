import express from 'express'
import { LiveStreamWebhookController } from './livestream.webhook.controller'

const router = express.Router()

// Agora webhook (no auth required - secured by webhook secret)
router.post('/agora', LiveStreamWebhookController.agoraWebhook)

export const LiveStreamWebhookRoutes = router
