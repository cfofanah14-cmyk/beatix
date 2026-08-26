import { Router } from 'express';
import { requireAdmin, requireApprovedOrganizer } from '../middleware/auth';
import { promoteToOrganizer, demoteOrganizer, getMyOrganizerProfile } from '../controllers/organizerController';

const router = Router();

// Admin-only actions
router.post('/:userId/promote', requireAdmin, promoteToOrganizer);
router.post('/:userId/demote', requireAdmin, demoteOrganizer);

// Organizer-facing: check my own approval status / profile
router.get('/me', requireApprovedOrganizer, getMyOrganizerProfile);

export default router;
