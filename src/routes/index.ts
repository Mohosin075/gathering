import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { NotificationRoutes } from '../app/modules/notifications/notifications.route'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { UploadRoutes } from '../app/modules/upload/upload.route'
import { EventRoutes } from '../app/modules/event/event.route'
import { PromotionRoutes } from '../app/modules/promotion/promotion.route'
import { TicketRoutes } from '../app/modules/ticket/ticket.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/notifications', route: NotificationRoutes },
  { path: '/public', route: PublicRoutes },
  { path: '/support', route: SupportRoutes },
  { path: '/upload', route: UploadRoutes },
  { path: '/event', route: EventRoutes },
  { path: '/promotion', route: PromotionRoutes },
  { path: '/ticket', route: TicketRoutes }]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
