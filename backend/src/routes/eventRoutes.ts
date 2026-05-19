import { Router, RequestHandler } from 'express';
import { listEvents, getEvent, createEvent, updateEvent, deleteEvent, getMyEvents } from '../controllers/eventController';
import { requireAuth, requireOrganizer } from '../middleware/auth';

const router = Router();

const auth      = requireAuth    as RequestHandler;
const organizer = requireOrganizer as RequestHandler;

router.get('/',               listEvents   as RequestHandler);
router.get('/mine',           organizer, getMyEvents   as RequestHandler);
router.get('/:id',            getEvent     as RequestHandler);
router.post('/',              organizer, createEvent   as RequestHandler);
router.put('/:id',            auth,      updateEvent   as RequestHandler);
router.delete('/:id',         auth,      deleteEvent   as RequestHandler);

export default router;
