import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  frontendUrl: string;
  allowedOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const config: Config = {
  port: parseInt(optional('PORT', '3001')),
  nodeEnv: optional('NODE_ENV', 'development'),

  jwtSecret: optional('JWT_SECRET', 'dev-secret-change-in-prod'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
  jwtRefreshSecret: optional('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  jwtRefreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),

  stripeSecretKey: optional('STRIPE_SECRET_KEY', ''),
  stripeWebhookSecret: optional('STRIPE_WEBHOOK_SECRET', ''),

  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),
  allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),

  rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000')),
  rateLimitMaxRequests: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100')),
};

export default config;
