-- Beatix PostgreSQL schema — run once on Railway
-- psql $DATABASE_URL < src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(255),
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(30),
  password_hash VARCHAR(255),
  google_id     VARCHAR(255),
  avatar_url    TEXT,
  auth_provider VARCHAR(30)  NOT NULL DEFAULT 'phone',
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id             SERIAL PRIMARY KEY,
  organizer_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  location       VARCHAR(255),
  event_date     TIMESTAMPTZ  NOT NULL,
  sales_end_date TIMESTAMPTZ,
  banner_url     TEXT,
  status         VARCHAR(20)  NOT NULL DEFAULT 'published',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_categories (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       VARCHAR(100)   NOT NULL,
  price      NUMERIC(12,2)  NOT NULL,
  quantity   INTEGER        NOT NULL,
  sold       INTEGER        NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(id),
  event_id     INTEGER       NOT NULL REFERENCES events(id),
  category_id  INTEGER       NOT NULL REFERENCES ticket_categories(id),
  qr_code      VARCHAR(255)  UNIQUE NOT NULL,
  status       VARCHAR(20)   NOT NULL DEFAULT 'active',
  payment_ref  VARCHAR(255),
  amount_paid  NUMERIC(12,2) NOT NULL,
  purchased_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER       NOT NULL REFERENCES users(id),
  ticket_id        INTEGER       REFERENCES tickets(id),
  flutterwave_ref  VARCHAR(255),
  amount           NUMERIC(12,2) NOT NULL,
  currency         VARCHAR(10)   NOT NULL DEFAULT 'SLL',
  status           VARCHAR(20)   NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_settings (
  id          SERIAL PRIMARY KEY,
  fee_percent NUMERIC(5,2)  NOT NULL DEFAULT 5.00,
  min_fee     NUMERIC(12,2) NOT NULL DEFAULT 5000.00,
  currency    VARCHAR(10)   NOT NULL DEFAULT 'SLL',
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Seed default fee setting if not present
INSERT INTO fee_settings (fee_percent, min_fee, currency)
SELECT 5.00, 5000.00, 'SLL'
WHERE NOT EXISTS (SELECT 1 FROM fee_settings);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer  ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status     ON events(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user      ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event     ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr        ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_payments_user     ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref      ON payments(flutterwave_ref);
