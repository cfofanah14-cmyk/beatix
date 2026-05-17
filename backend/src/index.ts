import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database';
import { runMigrations } from './config/migrate';
import { config } from './config/config';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import ordersRoutes from './routes/orders.routes';
import usersRoutes from './routes/users.routes';

const app = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────
// Note: Stripe webhook needs raw body — handled inside orders routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);

// ── 404 & Error handling ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    await runMigrations();

    app.listen(config.port, () => {
      console.log(`🚀 Beatix API running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

export default app;
