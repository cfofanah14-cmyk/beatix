import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/client';
import { AuthRequest, UserRow, PublicUser } from '../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGoogleClient(): OAuth2Client {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error('GOOGLE_CLIENT_ID not set');
  return new OAuth2Client(id);
}

function signToken(userId: number, email: string, role: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ userId, email, role }, secret, { expiresIn: '7d' });
}

function toPublic(u: UserRow): PublicUser {
  return { id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, avatar_url: u.avatar_url, role: u.role };
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────

export async function googleSignIn(req: Request, res: Response): Promise<void> {
  const { credential } = req.body as { credential?: string };
  if (!credential) { res.status(400).json({ error: 'credential is required' }); return; }

  try {
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p?.email) { res.status(400).json({ error: 'Invalid Google token' }); return; }

    const { email, name, sub: googleId, picture } = p;

    let result = await query<UserRow>('SELECT * FROM users WHERE email=$1', [email]);
    let user = result.rows[0];

    if (!user) {
      const ins = await query<UserRow>(
        `INSERT INTO users (email,full_name,google_id,avatar_url,auth_provider,role,created_at,updated_at)
         VALUES ($1,$2,$3,$4,'google','user',NOW(),NOW()) RETURNING *`,
        [email, name ?? email, googleId, picture ?? null]
      );
      user = ins.rows[0];
    } else if (!user.google_id) {
      await query('UPDATE users SET google_id=$1, updated_at=NOW() WHERE id=$2', [googleId, user.id]);
    }

    res.json({ success: true, token: signToken(user.id, user.email, user.role), user: toPublic(user) });
  } catch (err) {
    console.error('[googleSignIn]', err);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  const { full_name, email, phone, password } = req.body as {
    full_name?: string; email?: string; phone?: string; password?: string;
  };
  if (!email || !password) { res.status(400).json({ error: 'email and password are required' }); return; }

  try {
    const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) { res.status(409).json({ error: 'Email already registered' }); return; }

    const hash = await bcrypt.hash(password, 12);
    const result = await query<UserRow>(
      `INSERT INTO users (full_name,email,phone,password_hash,auth_provider,role,created_at,updated_at)
       VALUES ($1,$2,$3,$4,'phone','user',NOW(),NOW()) RETURNING *`,
      [full_name ?? null, email, phone ?? null, hash]
    );
    const user = result.rows[0];
    res.status(201).json({ success: true, token: signToken(user.id, user.email, user.role), user: toPublic(user) });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: 'email and password are required' }); return; }

  try {
    const result = await query<UserRow>('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    if (!user.password_hash) {
      res.status(401).json({ error: 'This account uses Google Sign-In' }); return;
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    res.json({ success: true, token: signToken(user.id, user.email, user.role), user: toPublic(user) });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

// ─── Get current user ─────────────────────────────────────────────────────────

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await query<UserRow>('SELECT * FROM users WHERE id=$1', [req.user!.userId]);
    if (!result.rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user: toPublic(result.rows[0]) });
  } catch (err) {
    console.error('[getMe]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

