import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { UploadRoutes } from '../app/modules/upload/upload.route'
import { EventRoutes } from '../app/modules/event/event.route'
import { PromotionRoutes } from '../app/modules/promotion/promotion.route'
import { TicketRoutes } from '../app/modules/ticket/ticket.route'
import { PaymentRoutes } from '../app/modules/payment/payment.route'
import { NotificationRoutes } from '../app/modules/notification/notification.routes'
import { MessageRoutes } from '../app/modules/message/message.routes'
import { ChatRoutes } from '../app/modules/chat/chat.routes'
import { ReviewRoutes } from '../app/modules/review/review.route'
import { SavedEventRoutes } from '../app/modules/savedEvent/savedEvent.route'
import { AttendeeRoutes } from '../app/modules/attendee/attendee.route'
import { MeetingRoutes } from '../app/modules/meeting/meeting.route'

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
  { path: '/ticket', route: TicketRoutes },
  { path: '/payment', route: PaymentRoutes },
  { path: '/message', route: MessageRoutes },
  { path: '/chat', route: ChatRoutes },
  { path: '/review', route: ReviewRoutes },
  { path: '/saved', route: SavedEventRoutes },
  { path: '/attendee', route: AttendeeRoutes },
  { path: '/meetings', route: MeetingRoutes },
]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
