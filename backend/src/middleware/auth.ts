import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types/index';
import { query } from '../db/client';

// ─── Verify JWT ─────────────────────────────────────────────────────────────
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

// ─── Require admin role ─────────────────────────────────────────────────────
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

// ─── Require organizer or admin (role check only) ──────────────────────────
export function requireOrganizer(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'organizer' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Organizer access required' });
      return;
    }
    next();
  });
}

// ─── Require an APPROVED organizer (role + organizers.status check) ───────
// This is the real gate for organizer dashboard access. Unlike requireOrganizer
// (which only checks the role flag), this confirms the user's organizers row
// actually has status = 'approved'. Admins always pass through.
// Returns a clear "can't access this dashboard" message otherwise.
export async function requireApprovedOrganizer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  requireAuth(req, res, async () => {
    if (req.user?.role === 'admin') {
      next();
      return;
    }
    if (req.user?.role !== 'organizer') {
      res.status(403).json({ error: "You can't access this dashboard." });
      return;
    }
    try {
      const result = await query<{ status: string }>(
        'SELECT status FROM organizers WHERE user_id=$1',
        [req.user.userId]
      );
      if (!result.rows[0] || result.rows[0].status !== 'approved') {
        res.status(403).json({ error: "You can't access this dashboard." });
        return;
      }
      next();
    } catch (err) {
      console.error('[requireApprovedOrganizer]', err);
      res.status(500).json({ error: 'Failed to verify organizer access' });
    }
  });
}
