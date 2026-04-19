import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWTPayload, UserRole } from '../types'

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' })
    return
  }
  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET!) as JWTPayload
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }
    if (!roles.includes(req.user.role)) { res.status(403).json({ success: false, message: 'Insufficient permissions' }); return }
    next()
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET!) as JWTPayload } catch {}
  }
  next()
}
