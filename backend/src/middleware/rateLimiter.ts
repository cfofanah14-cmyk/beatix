import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5,
  message: { success: false, message: 'Too many auth attempts, please wait 1 minute.' },
})

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  message: { success: false, message: 'Too many payment requests.' },
})
