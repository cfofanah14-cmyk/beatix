import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'

import { testConnection } from './db/client'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'

import authRoutes      from './routes/auth'
import eventRoutes     from './routes/events'
import ticketRoutes    from './routes/tickets'
import paymentRoutes   from './routes/payments'
import qrRoutes        from './routes/qr'
import userRoutes      from './routes/users'
import organizerRoutes from './routes/organizers'
import adminRoutes     from './routes/admin'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// ── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/', rateLimiter)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'beatix-api', timestamp: new Date().toISOString() })
})

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/events',     eventRoutes)
app.use('/api/tickets',    ticketRoutes)
app.use('/api/payments',   paymentRoutes)
app.use('/api/qr',         qrRoutes)
app.use('/api/users',      userRoutes)
app.use('/api/organizers', organizerRoutes)
app.use('/api/admin',      adminRoutes)

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await testConnection()
    console.log('✅ PostgreSQL connected')
    app.listen(PORT, () => {
      console.log(`🚀 Beatix API running on port ${PORT} [${process.env.NODE_ENV}]`)
    })
  } catch (err) {
    console.error('❌ Failed to connect to database:', err)
    process.exit(1)
  }
}

start()
export default app
