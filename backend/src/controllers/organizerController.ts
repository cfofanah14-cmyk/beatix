import { Response } from 'express';
import pool, { query } from '../db/client';
import { AuthRequest, OrganizerRow, UserRow } from '../types/index';

// ─── Promote a user to organizer (admin only) ─────────────────────────────
// Sets users.role = 'organizer' AND creates an approved organizers row,
// in a single transaction. org_name / bank details / etc. are left NULL —
// the organizer fills those in themselves later from their dashboard.
export async function promoteToOrganizer(req: AuthRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const adminId = req.user!.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query<UserRow>('SELECT id, role FROM users WHERE id=$1', [userId]);
    if (!userCheck.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (userCheck.rows[0].role === 'organizer') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'User is already an organizer' });
      return;
    }

    await client.query('UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2', ['organizer', userId]);

    // If they were an organizer before and got demoted, reactivate their old row
    // instead of creating a duplicate.
    const existing = await client.query<OrganizerRow>('SELECT id FROM organizers WHERE user_id=$1', [userId]);

    let organizer: OrganizerRow;
    if (existing.rows[0]) {
      const reactivated = await client.query<OrganizerRow>(
        `UPDATE organizers
         SET status='approved', verified_by=$1, verified_at=NOW(), updated_at=NOW()
         WHERE user_id=$2 RETURNING *`,
        [adminId, userId]
      );
      organizer = reactivated.rows[0];
    } else {
      const created = await client.query<OrganizerRow>(
        `INSERT INTO organizers (user_id, status, verified_by, verified_at, total_earnings, total_payouts, fee_type, created_at, updated_at)
         VALUES ($1, 'approved', $2, NOW(), 0, 0, 'standard', NOW(), NOW())
         RETURNING *`,
        [userId, adminId]
      );
      organizer = created.rows[0];
    }

    await client.query('COMMIT');
    res.json({ success: true, organizer });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[promoteToOrganizer]', err);
    res.status(500).json({ error: 'Failed to promote user to organizer' });
  } finally {
    client.release();
  }
}

// ─── Demote an organizer back to a regular user (admin only) ─────────────
// Sets users.role = 'user' and organizers.status = 'suspended'.
// We keep the organizers row (not delete it) to preserve earnings/payout history.
export async function demoteOrganizer(req: AuthRequest, res: Response): Promise<void> {
  const { userId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query<UserRow>('SELECT id, role FROM users WHERE id=$1', [userId]);
    if (!userCheck.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (userCheck.rows[0].role !== 'organizer') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'User is not currently an organizer' });
      return;
    }

    await client.query('UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2', ['user', userId]);
    const result = await client.query<OrganizerRow>(
      `UPDATE organizers SET status='suspended', updated_at=NOW() WHERE user_id=$1 RETURNING *`,
      [userId]
    );

    await client.query('COMMIT');
    res.json({ success: true, organizer: result.rows[0] ?? null });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[demoteOrganizer]', err);
    res.status(500).json({ error: 'Failed to demote organizer' });
  } finally {
    client.release();
  }
}

// ─── Get my own organizer profile (organizer-facing) ──────────────────────
// Used by the frontend to check approval status and load profile data
// for the buyer<->organizer switch and dashboard.
export async function getMyOrganizerProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await query<OrganizerRow>('SELECT * FROM organizers WHERE user_id=$1', [req.user!.userId]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No organizer profile found for this user' });
      return;
    }
    res.json({ organizer: result.rows[0] });
  } catch (err) {
    console.error('[getMyOrganizerProfile]', err);
    res.status(500).json({ error: 'Failed to fetch organizer profile' });
  }
}
