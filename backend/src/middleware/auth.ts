import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types/index';

// ─── Verify JWT ───────────────────────────────────────────────────────────────
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET missing' });
    return;
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

// ─── Require admin role ───────────────────────────────────────────────────────
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

// ─── Require organizer or admin ───────────────────────────────────────────────
export function requireOrganizer(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'organizer' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Organizer access required' });
      return;
    }
    next();
  });
}
