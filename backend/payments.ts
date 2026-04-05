import { Router } from 'express'
import { body } from 'express-validator'
import * as PaymentsController from '../controllers/paymentsController'
import { authenticate, optionalAuth } from '../middleware/auth'
import { paymentLimiter } from '../middleware/rateLimiter'

const router = Router()

// POST /api/payments/initiate
// Initiate a ticket purchase and create a pending transaction
router.post(
  '/initiate',
  paymentLimiter,
  optionalAuth,
  [
    body('event_id').isUUID(),
    body('ticket_type_id').isUUID(),
    body('quantity').isInt({ min: 1, max: 10 }),
    body('payment_method').isIn(['afrimoney', 'orange_money', 'card']),
    body('buyer_phone').isMobilePhone('any'),
    body('buyer_name').optional().isString(),
  ],
  PaymentsController.initiatePayment
)

// POST /api/payments/verify
// Verify payment with Flutterwave after redirect
router.post('/verify', optionalAuth, PaymentsController.verifyPayment)

// POST /api/payments/webhook
// Flutterwave webhook — receives payment status updates
router.post('/webhook', PaymentsController.handleWebhook)

// POST /api/payments/validate-discount
// Validate a discount code before checkout
router.post(
  '/validate-discount',
  [
    body('event_id').isUUID(),
    body('code').notEmpty(),
  ],
  PaymentsController.validateDiscount
)

// GET /api/payments/transaction/:id
router.get('/transaction/:id', authenticate, PaymentsController.getTransaction)

export default router
