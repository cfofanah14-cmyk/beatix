import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

const generateToken = (user: { id: number; email: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role } as JwtPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// ─── Google Sign In ───────────────────────────────────────────────────────────
export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid Google token' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    let result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );
    let user = result.rows[0];

    if (!user) {
      result = await pool.query(
        `INSERT INTO users (name, email, google_id, avatar_url, role, created_at, last_active)
         VALUES ($1, $2, $3, $4, 'user', NOW(), NOW()) RETURNING *`,
        [name, email, googleId, picture]
      );
      user = result.rows[0];
    } else {
      await pool.query(
        `UPDATE users SET last_active = NOW(), google_id = COALESCE(google_id, $1), avatar_url = COALESCE(avatar_url, $2) WHERE id = $3`,
        [googleId, picture, user.id]
      );
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar_url: user.avatar_url, role: user.role },
    });
  } catch (err) {
    console.error('Google sign-in error:', err);
    res.status(401).json({ success: false, message: 'Google authentication failed' });
  }
};

// ─── Phone/Password Register ──────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      res.status(400).json({ message: 'All fields required' });
      return;
    }

    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length) {
      res.status(409).json({ message: 'Phone number already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, phone, password, role, created_at, last_active)
       VALUES ($1, $2, $3, 'user', NOW(), NOW()) RETURNING *`,
      [name, phone, hashedPassword]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Phone/Password Login ─────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      res.status(400).json({ message: 'Phone and password required' });
      return;
    }

    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    const user = result.rows[0];

    if (!user || !user.password) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, avatar_url, role, created_at FROM users WHERE id = $1',
      [(req as any).user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
