import { Response, NextFunction } from 'express';
import { body, param, query as qv } from 'express-validator';
import * as eventsService from '../services/events.service';
import { AuthRequest } from '../types';

export const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('starts_at').isISO8601().withMessage('Valid start date required'),
  body('ends_at').optional().isISO8601(),
  body('price').optional().isNumeric(),
];

export const listEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, status, category, search } = req.query as Record<string, string>;
    const result = await eventsService.getEvents({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      category,
      search,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    const tiers = await eventsService.getTicketTiers(event.id);
    res.json({ success: true, data: { event, ticket_tiers: tiers } });
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Fetch organizer profile for this user
    const { query } = await import('../config/database');
    const orgResult = await query(
      'SELECT id FROM organizer_profiles WHERE user_id = $1',
      [req.user!.userId]
    );

    if (!orgResult.rows[0]) {
      res.status(400).json({ success: false, error: 'Organizer profile not found' });
      return;
    }

    const event = await eventsService.createEvent(orgResult.rows[0].id, req.body);
    res.status(201).json({ success: true, data: { event } });
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = await import('../config/database');
    const orgResult = await query(
      'SELECT id FROM organizer_profiles WHERE user_id = $1',
      [req.user!.userId]
    );

    if (!orgResult.rows[0]) {
      res.status(403).json({ success: false, error: 'Not an organizer' });
      return;
    }

    const event = await eventsService.updateEvent(req.params.id, orgResult.rows[0].id, req.body);
    res.json({ success: true, data: { event } });
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = await import('../config/database');
    const orgResult = await query(
      'SELECT id FROM organizer_profiles WHERE user_id = $1',
      [req.user!.userId]
    );

    await eventsService.deleteEvent(req.params.id, orgResult.rows[0].id);
    res.json({ success: true, message: 'Event cancelled' });
  } catch (err) {
    next(err);
  }
};

export const getEventTiers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tiers = await eventsService.getTicketTiers(req.params.id);
    res.json({ success: true, data: { ticket_tiers: tiers } });
  } catch (err) {
    next(err);
  }
};

export const createTicketTier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tier = await eventsService.createTicketTier(req.params.id, req.body);
    res.status(201).json({ success: true, data: { tier } });
  } catch (err) {
    next(err);
  }
};
