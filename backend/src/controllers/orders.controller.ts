import { Request, Response, NextFunction } from 'express';
import * as ordersService from '../services/orders.service';
import { AuthRequest } from '../types';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { order, clientSecret } = await ordersService.createOrder(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      data: { order, clientSecret },
    });
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await ordersService.getUserOrders(req.user!.userId);
    res.json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tickets = await ordersService.getUserTickets(req.user!.userId);
    res.json({ success: true, data: { tickets } });
  } catch (err) {
    next(err);
  }
};

export const checkIn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const ticket = await ordersService.checkInTicket(req.params.qrCode, orgResult.rows[0].id);
    res.json({ success: true, data: { ticket } });
  } catch (err) {
    next(err);
  }
};

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    await ordersService.handleStripeWebhook(req.body as Buffer, sig);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
