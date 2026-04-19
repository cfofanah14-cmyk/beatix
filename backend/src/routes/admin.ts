import { Router } from 'express'
import * as AdminController from '../controllers/adminController'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

// All admin routes require admin role
router.use(authenticate, requireRole('admin'))

router.get('/stats',                       AdminController.getPlatformStats)
router.get('/organizers',                  AdminController.listOrganizers)
router.patch('/organizers/:id/approve',    AdminController.approveOrganizer)
router.patch('/organizers/:id/suspend',    AdminController.suspendOrganizer)
router.get('/fraud-flags',                 AdminController.listFraudFlags)
router.patch('/fraud-flags/:id/resolve',   AdminController.resolveFraudFlag)
router.get('/reports',                     AdminController.listReports)
router.patch('/payouts/:id',               AdminController.processPayout)

export default router
