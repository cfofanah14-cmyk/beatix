-- ============================================================
-- BEATIX — PostgreSQL Database Schema
-- Run: npm run db:migrate
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE user_role         AS ENUM ('buyer','organizer','admin','staff');
CREATE TYPE organizer_status  AS ENUM ('pending','approved','suspended');
CREATE TYPE event_status      AS ENUM ('draft','published','cancelled','completed');
CREATE TYPE ticket_status     AS ENUM ('active','used','refunded','cancelled');
CREATE TYPE transaction_status AS ENUM ('pending','success','failed','refunded');
CREATE TYPE payment_method    AS ENUM ('afrimoney','orange_money','card');
CREATE TYPE payout_status     AS ENUM ('pending','processing','paid','failed');

-- USERS
CREATE TABLE users (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone          VARCHAR(20) UNIQUE NOT NULL,
  name           VARCHAR(120),
  email          VARCHAR(200) UNIQUE,
  role           user_role   NOT NULL DEFAULT 'buyer',
  avatar_url     TEXT,
  language       VARCHAR(10) NOT NULL DEFAULT 'en',
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  phone_verified BOOLEAN     NOT NULL DEFAULT FALSE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP CODES
CREATE TABLE otp_codes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone      VARCHAR(20) NOT NULL,
  code       VARCHAR(6)  NOT NULL,
  purpose    VARCHAR(30) NOT NULL DEFAULT 'login',
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_otp_phone   ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- ORGANIZERS
CREATE TABLE organizers (
  id                   UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_name             VARCHAR(200)     NOT NULL,
  description          TEXT,
  logo_url             TEXT,
  website              VARCHAR(300),
  social_links         JSONB            DEFAULT '{}',
  status               organizer_status NOT NULL DEFAULT 'pending',
  verified_at          TIMESTAMPTZ,
  verified_by          UUID             REFERENCES users(id),
  bank_name            VARCHAR(100),
  bank_account         VARCHAR(50),
  mobile_money_number  VARCHAR(20),
  total_earnings       NUMERIC(12,2)    NOT NULL DEFAULT 0,
  total_payouts        NUMERIC(12,2)    NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- STAFF
CREATE TABLE staff (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID        NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(30) NOT NULL DEFAULT 'scanner',
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizer_id, user_id)
);

-- EVENTS
CREATE TABLE events (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id    UUID         NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  category        VARCHAR(50)  NOT NULL DEFAULT 'Other',
  cover_image_url TEXT,
  venue_name      VARCHAR(200) NOT NULL,
  venue_address   TEXT,
  city            VARCHAR(100) NOT NULL DEFAULT 'Freetown',
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  starts_at       TIMESTAMPTZ  NOT NULL,
  ends_at         TIMESTAMPTZ,
  sales_end_at    TIMESTAMPTZ,
  status          event_status NOT NULL DEFAULT 'draft',
  is_boosted      BOOLEAN      NOT NULL DEFAULT FALSE,
  boosted_until   TIMESTAMPTZ,
  total_capacity  INTEGER,
  tickets_sold    INTEGER      NOT NULL DEFAULT 0,
  refund_policy   TEXT,
  tags            TEXT[]       DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_status    ON events(status);
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_category  ON events(category);

-- TICKET TYPES
CREATE TABLE ticket_types (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id       UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name           VARCHAR(80)   NOT NULL,
  description    TEXT,
  price          NUMERIC(10,2) NOT NULL,
  capacity       INTEGER       NOT NULL,
  sold           INTEGER       NOT NULL DEFAULT 0,
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at   TIMESTAMPTZ,
  sort_order     INTEGER       NOT NULL DEFAULT 0,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);

-- DISCOUNT CODES
CREATE TABLE discount_codes (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code         VARCHAR(30)   NOT NULL,
  discount_pct NUMERIC(5,2)  NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  max_uses     INTEGER,
  times_used   INTEGER       NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, code)
);

-- TRANSACTIONS
CREATE TABLE transactions (
  id                 UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID               REFERENCES users(id),
  event_id           UUID               NOT NULL REFERENCES events(id),
  ticket_type_id     UUID               NOT NULL REFERENCES ticket_types(id),
  quantity           INTEGER            NOT NULL DEFAULT 1,
  unit_price         NUMERIC(10,2)      NOT NULL,
  subtotal           NUMERIC(10,2)      NOT NULL,
  service_fee        NUMERIC(10,2)      NOT NULL,
  discount_amount    NUMERIC(10,2)      NOT NULL DEFAULT 0,
  total_amount       NUMERIC(10,2)      NOT NULL,
  payment_method     payment_method     NOT NULL,
  payment_reference  VARCHAR(100),
  flw_transaction_id VARCHAR(100),
  status             transaction_status NOT NULL DEFAULT 'pending',
  discount_code_id   UUID               REFERENCES discount_codes(id),
  buyer_phone        VARCHAR(20),
  buyer_name         VARCHAR(120),
  metadata           JSONB              DEFAULT '{}',
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_user      ON transactions(user_id);
CREATE INDEX idx_transactions_event     ON transactions(event_id);
CREATE INDEX idx_transactions_status    ON transactions(status);
CREATE INDEX idx_transactions_reference ON transactions(payment_reference);

-- TICKETS (individual QR tickets)
CREATE TABLE tickets (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID          NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  event_id       UUID          NOT NULL REFERENCES events(id),
  ticket_type_id UUID          NOT NULL REFERENCES ticket_types(id),
  user_id        UUID          REFERENCES users(id),
  ticket_number  VARCHAR(30)   NOT NULL UNIQUE,
  qr_code_data   TEXT          NOT NULL UNIQUE,
  qr_code_image  TEXT,
  status         ticket_status NOT NULL DEFAULT 'active',
  scanned_at     TIMESTAMPTZ,
  scanned_by     UUID          REFERENCES users(id),
  buyer_name     VARCHAR(120),
  buyer_phone    VARCHAR(20),
  metadata       JSONB         DEFAULT '{}',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tickets_transaction ON tickets(transaction_id);
CREATE INDEX idx_tickets_event       ON tickets(event_id);
CREATE INDEX idx_tickets_user        ON tickets(user_id);
CREATE INDEX idx_tickets_number      ON tickets(ticket_number);
CREATE INDEX idx_tickets_qr          ON tickets(qr_code_data);
CREATE INDEX idx_tickets_status      ON tickets(status);

-- WISHLISTS
CREATE TABLE wishlists (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(30) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT        NOT NULL,
  data       JSONB       DEFAULT '{}',
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  sent_sms   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- PAYOUTS
CREATE TABLE payouts (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id    UUID          NOT NULL REFERENCES organizers(id),
  amount          NUMERIC(12,2) NOT NULL,
  method          VARCHAR(30)   NOT NULL,
  account_details JSONB         NOT NULL DEFAULT '{}',
  status          payout_status NOT NULL DEFAULT 'pending',
  reference       VARCHAR(100),
  notes           TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- FRAUD FLAGS
CREATE TABLE fraud_flags (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID        NOT NULL REFERENCES transactions(id),
  reason         TEXT        NOT NULL,
  resolved       BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved_by    UUID        REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REPORTS
CREATE TABLE reports (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID        REFERENCES users(id),
  target_type VARCHAR(30) NOT NULL,
  target_id   UUID        NOT NULL,
  reason      TEXT        NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUTO UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_organizers   BEFORE UPDATE ON organizers   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_events       BEFORE UPDATE ON events       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_transactions BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
