import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { config } from '../config/config';
import { User, SafeUser, AuthTokens, JwtPayload, RegisterBody } from '../types';
import { AppError } from '../middleware/error.middleware';

const SALT_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const generateTokens = (user: SafeUser): AuthTokens => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

export const createUser = async (body: RegisterBody): Promise<SafeUser> => {
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [body.email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('Email already in use', 409);
  }

  const passwordHash = await hashPassword(body.password);
  const role = body.role === 'organizer' ? 'organizer' : 'fan';

  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name, last_name, avatar_url, role, is_verified, stripe_customer_id, created_at, updated_at`,
    [body.email, passwordHash, body.first_name, body.last_name, role]
  );

  return result.rows[0] as SafeUser;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id: string): Promise<SafeUser | null> => {
  const result = await query(
    `SELECT id, email, first_name, last_name, avatar_url, role, is_verified, stripe_customer_id, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};

export const validateRefreshToken = async (token: string): Promise<JwtPayload> => {
  const result = await query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  try {
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
};
