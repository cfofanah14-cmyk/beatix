import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/users/profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.role, u.created_at,
              op.id as organizer_id, op.org_name, op.description, op.website, op.logo_url, op.is_approved
       FROM users u
       LEFT JOIN organizer_profiles op ON u.id = op.user_id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { first_name, last_name, avatar_url } = req.body;
    const result = await query(
      `UPDATE users SET first_name = COALESCE($1, first_name),
                        last_name  = COALESCE($2, last_name),
                        avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, email, first_name, last_name, avatar_url, role, is_verified`,
      [first_name, last_name, avatar_url, req.user!.userId]
    );
    res.json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/organizer-profile — become an organizer
router.post('/organizer-profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { org_name, description, website } = req.body;

    if (!org_name) {
      res.status(400).json({ success: false, error: 'org_name is required' });
      return;
    }

    // Upgrade role if needed
    await query("UPDATE users SET role = 'organizer' WHERE id = $1 AND role = 'fan'", [req.user!.userId]);

    const result = await query(
      `INSERT INTO organizer_profiles (user_id, org_name, description, website)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
         SET org_name = EXCLUDED.org_name,
             description = EXCLUDED.description,
             website = EXCLUDED.website
       RETURNING *`,
      [req.user!.userId, org_name, description || null, website || null]
    );

    res.status(201).json({ success: true, data: { organizer: result.rows[0] } });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/admin/list — admin only
router.get('/admin/list', authenticate, requireRole('admin'), async (_req, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ success: true, data: { users: result.rows } });
  } catch (err) {
    next(err);
  }
});

export default router;
