import { pool } from './database';

const schema = `
-- ============================================================
-- BEATIX DATABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  avatar_url    TEXT,
  role          VARCHAR(20) NOT NULL DEFAULT 'fan' CHECK (role IN ('fan', 'organizer', 'admin')),
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ============================================================
-- ORGANIZER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS organizer_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_name      VARCHAR(255) NOT NULL,
  description   TEXT,
  website       TEXT,
  logo_url      TEXT,
  stripe_account_id VARCHAR(255),
  is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizer_user ON organizer_profiles(user_id);

-- ============================================================
-- VENUES
-- ============================================================
CREATE TABLE IF NOT EXISTS venues (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  address       TEXT NOT NULL,
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100),
  country       VARCHAR(100) NOT NULL DEFAULT 'Sierra Leone',
  zip_code      VARCHAR(20),
  latitude      DECIMAL(9,6),
  longitude     DECIMAL(9,6),
  capacity      INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id    UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  venue_id        UUID REFERENCES venues(id) ON DELETE SET NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  cover_image_url TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  timezone        VARCHAR(100) NOT NULL DEFAULT 'Africa/Freetown',
  status          VARCHAR(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_online       BOOLEAN NOT NULL DEFAULT FALSE,
  stream_url      TEXT,
  max_attendees   INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status    ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

-- ============================================================
-- TICKET TIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency        VARCHAR(10) NOT NULL DEFAULT 'SLL',
  quantity_total  INTEGER NOT NULL,
  quantity_sold   INTEGER NOT NULL DEFAULT 0,
  sale_starts_at  TIMESTAMPTZ,
  sale_ends_at    TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_quantity CHECK (quantity_sold <= quantity_total)
);

CREATE INDEX IF NOT EXISTS idx_tiers_event ON ticket_tiers(event_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  total_amount        DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'SLL',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id    VARCHAR(255),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event  ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_tier_id  UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================================
-- TICKETS (issued after payment)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id   UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  ticket_tier_id  UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  qr_code         VARCHAR(255) UNIQUE NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'valid'
                    CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user    ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event   ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user  ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(100),
  entity_id   UUID,
  meta        JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs(created_at);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to timestamped tables
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','organizer_profiles','events','ticket_tiers','orders'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;
`;

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    await client.query(schema);
    console.log('✅ Database migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run directly: npx ts-node src/config/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
