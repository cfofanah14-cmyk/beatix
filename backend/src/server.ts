import dotenv from 'dotenv';
dotenv.config(); // Must be first — before any import that reads process.env

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes      from './routes/authRoutes';
import userRoutes      from './routes/userRoutes';
import eventRoutes     from './routes/eventRoutes';
import ticketRoutes    from './routes/ticketRoutes';
import adminRoutes     from './routes/adminRoutes';
import organizerRoutes from './routes/organizerRoutes';

const app  = express();
const PORT = process.env.PORT ?? 4000;

// ─── Allowed CORS origins ───────────────────────────────────────────────────
const allowed: string[] = [
  'http://localhost:3000',
  'https://beatix-sll.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'beatix-api', ts: new Date().toISOString() }));

app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/events',     eventRoutes);
app.use('/api/tickets',    ticketRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/organizers', organizerRoutes);

// ─── Fallback ────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ─── Error handler ───────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`✅  Beatix API on port ${PORT}`));

export default app;
