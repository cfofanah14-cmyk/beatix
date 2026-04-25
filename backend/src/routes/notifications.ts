import { Router } from 'express'
import { body } from 'express-validator'
import * as C from '../controllers/notificationsController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/',                 authenticate, C.getMyNotifications)
router.patch('/:id/read',       authenticate, C.markRead)
router.patch('/read-all',       authenticate, C.markAllRead)
router.post('/send-reminders',  authenticate, requireAdmin, C.sendEventReminders)
router.get('/social-settings',  C.getSocialSettings)
router.post('/social-follow',   authenticate, [body('platform').isIn(['instagram','facebook','tiktok'])], C.recordSocialFollow)

export default router
