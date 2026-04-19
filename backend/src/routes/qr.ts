import { Router } from 'express'
import { body } from 'express-validator'
import * as QrController from '../controllers/qrController'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

router.post('/scan',            authenticate, requireRole('admin','staff','organizer'), [body('token').notEmpty()], QrController.scanTicket)
router.get('/ticket/:ticketNumber', authenticate, requireRole('admin','staff','organizer'), QrController.lookupByNumber)

export default router
