import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { scanTicket, getCheckInStats } from '../controllers/qrController'

const router = Router()

// POST /api/qr/scan  — admin or organizer (staff) only
router.post(
  '/scan',
  authenticate,
  requireRole('admin', 'organizer'),
  scanTicket
)

// GET /api/qr/stats/:eventId  — admin or organizer only
router.get(
  '/stats/:eventId',
  authenticate,
  requireRole('admin', 'organizer'),
  getCheckInStats
)

export default router
