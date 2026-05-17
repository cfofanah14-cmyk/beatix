import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/client';
import { AuthRequest, PublicUser } from '../types';

// ─── Lazy OAuth client (must not run at module load before dotenv) ────────────
function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');
  return new OAuth2Client(clientId);
}

function issueToken(userId: number, email: string, role: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ userId, email, role }, secret, { expiresIn: '7d' });
}

function toPublicUser(row: {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}): PublicUser {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    avatar_url: row.avatar_url,
    role: row.role ?? 'user',
  };
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────
export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      res.status(400).json({ error: 'Missing Google credential token' });
      return;
    }

    const client = getOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(400).json({ error: 'Invalid Google token payload' });
      return;
    }

    const { email, name, sub: googleId, picture } = payload;

    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      const insert = await pool.query(
        `INSERT INTO users (email, full_name, google_id, avatar_url, auth_provider, role, created_at, updated_at)
         VALUES ($1,$2,$3,$4,'google','user',NOW(),NOW()) RETURNING *`,
        [email, name ?? email, googleId, picture ?? null]
      );
      user = insert.rows[0];
    } else if (!user.google_id) {
      await pool.query(
        'UPDATE users SET google_id=$1, avatar_url=COALESCE(avatar_url,$2), updated_at=NOW() WHERE id=$3',
        [googleId, picture ?? null, user.id]
      );
    }

    res.json({ token: issueToken(user.id, user.email, user.role), user: toPublicUser(user) });
  } catch (err) {
    console.error('[googleSignIn]', err);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
};

// ─── Register with email + password ──────────────────────────────────────────
export const registerWithPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, password } = req.body as {
      full_name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, auth_provider, role, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'phone','user',NOW(),NOW()) RETURNING *`,
      [full_name ?? null, email, phone ?? null, hash]
    );

    const user = result.rows[0];
    res.status(201).json({ token: issueToken(user.id, user.email, user.role), user: toPublicUser(user) });
  } catch (err) {
    console.error('[registerWithPhone]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// ─── Login with email + password ─────────────────────────────────────────────
export const loginWithPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.password_hash) {
      res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.json({ token: issueToken(user.id, user.email, user.role), user: toPublicUser(user) });
  } catch (err) {
    console.error('[loginWithPhone]', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ─── Get current user (from JWT) ──────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [req.user!.userId]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: toPublicUser(result.rows[0]) });
  } catch (err) {
    console.error('[getMe]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
