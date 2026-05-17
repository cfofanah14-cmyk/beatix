import dotenv from 'dotenv';
dotenv.config(); // ← MUST be first line before any other imports read process.env

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import eventRoutes from './routes/eventRoutes';
import ticketRoutes from './routes/ticketRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Allowed origins ──────────────────────────────────────────────────────────
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'https://beatix.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin requests (Postman, curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ─── Middleware stack (order matters) ─────────────────────────────────────────
// cors() must come before routes and body parsers.
// It handles preflight OPTIONS automatically — do NOT add a separate
// app.options('*', cors()) after this, it overrides with default no-config cors.
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Beatix API running on port ${PORT}`);
});

export default app;
