import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';

// ─── Verify JWT and attach user to request ────────────────────────────────────
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// ─── Require admin role ───────────────────────────────────────────────────────
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
};

// ─── Require organizer or admin role ─────────────────────────────────────────
export const requireOrganizer = (req: AuthRequest, res: Response, next: NextFunction): void => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'organizer' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Organizer access required' });
      return;
    }
    next();
  });
};
