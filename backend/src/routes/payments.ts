import { Router } from 'express'
import { body } from 'express-validator'
import * as PaymentsController from '../controllers/paymentsController'
import { authenticate, optionalAuth } from '../middleware/auth'
import { paymentLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post('/initiate',          paymentLimiter, optionalAuth, [body('event_id').isUUID(), body('ticket_type_id').isUUID(), body('quantity').isInt({ min:1, max:10 }), body('payment_method').isIn(['afrimoney','orange_money','card']), body('buyer_phone').isMobilePhone('any')], PaymentsController.initiatePayment)
router.post('/verify',            optionalAuth, PaymentsController.verifyPayment)
router.post('/webhook',           PaymentsController.handleWebhook)
router.post('/validate-discount', [body('event_id').isUUID(), body('code').notEmpty()], PaymentsController.validateDiscount)
router.get('/transaction/:id',    authenticate, PaymentsController.getTransaction)

export default router
