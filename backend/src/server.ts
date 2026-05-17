import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Add every origin that calls this API. Include your Vercel URL here via env var.
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,          // e.g. https://beatix.vercel.app
  process.env.FRONTEND_URL_PREVIEW,  // optional second URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow curl/Postman/mobile
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors()); // handle preflight for all routes

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check — visit this to confirm env vars are loaded ─────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    googleClientId: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 20)}... ✅`
      : 'NOT SET ❌',
    jwtSecret: process.env.JWT_SECRET ? 'set ✅' : 'NOT SET ❌',
    allowedOrigins,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
// Add your other existing routes here:
// app.use('/api/profile', profileRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/events', eventRoutes);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Beatix API on port ${PORT}`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌ MISSING'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅' : '❌ MISSING'}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

export default app;
