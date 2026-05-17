import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../types';

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('role').optional().isIn(['fan', 'organizer']),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.createUser(req.body);
    const tokens = authService.generateTokens(user);
    await authService.saveRefreshToken(user.id, tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, ...tokens },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await authService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const valid = await authService.comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    const tokens = authService.generateTokens(safeUser);
    await authService.saveRefreshToken(user.id, tokens.refreshToken);

    res.json({
      success: true,
      data: { user: safeUser, ...tokens },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const payload = await authService.validateRefreshToken(refreshToken);
    const user = await authService.findUserById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    await authService.revokeRefreshToken(refreshToken);
    const tokens = authService.generateTokens(user);
    await authService.saveRefreshToken(user.id, tokens.refreshToken);

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
