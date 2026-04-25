import { Router } from 'express'
import { body } from 'express-validator'
import * as C from '../controllers/paymentsController'
import { authenticate, optionalAuth, requireOrganizer } from '../middleware/auth'
import { paymentLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post('/initiate',
  paymentLimiter,
  optionalAuth,
  [
    body('event_id').isUUID(),
    body('ticket_category_id').isUUID(),
    body('quantity').isInt({ min: 1, max: 10 }),
    body('payment_method').isIn(['afrimoney', 'orange_money', 'card']),
    body('buyer_phone').isMobilePhone('any'),
    body('buyer_name').notEmpty(),
  ],
  C.initiateTransaction
)

router.post('/verify',    optionalAuth, C.verifyTransaction)
router.post('/webhook',   C.handleWebhook)
router.post('/validate-discount', C.validateDiscount)

router.post('/payout',
  authenticate,
  requireOrganizer,
  [
    body('amount').isFloat({ min: 1 }),
    body('method').isIn(['mobile_money', 'bank']),
    body('account_number').notEmpty(),
    body('account_name').notEmpty(),
  ],
  C.requestPayout
)

router.get('/transaction/:id', authenticate, C.getTransaction)

export default router
