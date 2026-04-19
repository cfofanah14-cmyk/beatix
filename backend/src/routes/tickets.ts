import { Router } from 'express'
import * as TicketsController from '../controllers/ticketsController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/my',                    authenticate, TicketsController.getMyTickets)
router.get('/transaction/:txId',     authenticate, TicketsController.getTicketsByTransaction)
router.get('/:id',                   authenticate, TicketsController.getTicket)

export default router
