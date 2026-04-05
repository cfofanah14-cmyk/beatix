import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/client'
import { sendSms } from '../services/smsService'
import { AuthRequest } from '../middleware/auth'
import { JWTPayload } from '../types'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function signAccess(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
}

function signRefresh(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as jwt.SignOptions)
}

// POST /api/auth/send-otp
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const { phone } = req.body
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000)

    // Invalidate any existing OTPs for this phone
    await query('UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false', [phone])

    // Store new OTP
    await query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone, code, expiresAt]
    )

    // Send SMS
    await sendSms(phone, `Your Beatix verification code is: ${code}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes. Do not share this code.`)

    // Check if user already exists
    const userRes = await query('SELECT id FROM users WHERE phone = $1', [phone])
    const isNewUser = userRes.rows.length === 0

    res.json({
      success: true,
      message: 'OTP sent',
      isNewUser,
      // In development, return OTP directly
      ...(process.env.NODE_ENV === 'development' && { devOtp: code }),
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/verify-otp
export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const { phone, code, name } = req.body

    // Validate OTP
    const otpRes = await query(
      `SELECT id FROM otp_codes
       WHERE phone = $1 AND code = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    )

    if (otpRes.rows.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
      return
    }

    // Mark OTP as used
    await query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRes.rows[0].id])

    // Get or create user
    let userRes = await query(
      'SELECT id, phone, name, role, is_active FROM users WHERE phone = $1',
      [phone]
    )

    let user
    if (userRes.rows.length === 0) {
      // New user — create account
      const newUserRes = await query(
        `INSERT INTO users (phone, name, phone_verified)
         VALUES ($1, $2, true) RETURNING id, phone, name, role, is_active`,
        [phone, name || null]
      )
      user = newUserRes.rows[0]
    } else {
      user = userRes.rows[0]
      if (!user.is_active) {
        res.status(403).json({ success: false, message: 'Account suspended' })
        return
      }
      // Mark phone verified and update last login
      await query(
        'UPDATE users SET phone_verified = true, last_login_at = NOW() WHERE id = $1',
        [user.id]
      )
    }

    // Get organizer id if applicable
    let organizerId: string | undefined
    if (user.role === 'organizer') {
      const orgRes = await query('SELECT id FROM organizers WHERE user_id = $1', [user.id])
      if (orgRes.rows.length > 0) organizerId = orgRes.rows[0].id
    }

    const jwtPayload: JWTPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      organizerId,
    }

    const accessToken  = signAccess(jwtPayload)
    const refreshToken = signRefresh(jwtPayload)

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          organizerId,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/refresh
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' })
      return
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload
    const accessToken = signAccess(payload)

    res.json({ success: true, data: { accessToken } })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }
}

// POST /api/auth/logout
export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  // Stateless JWT — client should delete tokens
  // Future: add token blocklist via Redis
  res.json({ success: true, message: 'Logged out' })
}

// GET /api/auth/me
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userRes = await query(
      'SELECT id, phone, name, email, role, avatar_url, language, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    )
    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.json({ success: true, data: userRes.rows[0] })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/organizer/send-2fa
export async function sendOrganizer2FA(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user!.role !== 'organizer' && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not an organizer' })
      return
    }
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await query('UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false', [req.user!.phone])
    await query(
      'INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES ($1,$2,$3,$4)',
      [req.user!.phone, code, '2fa', expiresAt]
    )
    await sendSms(req.user!.phone, `Beatix 2FA code: ${code}. Valid 5 minutes.`)
    res.json({
      success: true,
      message: '2FA code sent',
      ...(process.env.NODE_ENV === 'development' && { devOtp: code }),
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/organizer/verify-2fa
export async function verifyOrganizer2FA(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.body
    const otpRes = await query(
      `SELECT id FROM otp_codes
       WHERE phone = $1 AND code = $2 AND purpose = '2fa' AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.phone, code]
    )
    if (otpRes.rows.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid or expired 2FA code' })
      return
    }
    await query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRes.rows[0].id])
    res.json({ success: true, message: '2FA verified' })
  } catch (err) {
    next(err)
  }
}
