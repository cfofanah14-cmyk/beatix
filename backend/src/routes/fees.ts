import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { getFeeSettings, updateFeeSettings, setOrganizerFee } from '../controllers/feeController'

const router = Router()

// All fee routes require admin role
router.get('/', authenticate, requireRole('admin'), getFeeSettings)
router.patch('/', authenticate, requireRole('admin'), updateFeeSettings)
router.patch('/organizer/:id', authenticate, requireRole('admin'), setOrganizerFee)

export default router
