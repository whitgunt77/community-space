-- ============================================================
--  Virtual Community Space – PostgreSQL Schema
--  Run: psql -U <user> -d community_space -f dbSchema.sql
-- ============================================================

-- Enable PostGIS for spatial queries (optional but recommended).
-- Requires the PostGIS extension to be installed on your cluster.
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  EVENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  -- Stored as plain NUMERIC columns so PostGIS is optional.
  -- Swap to GEOGRAPHY(POINT,4326) if you enable PostGIS.
  lat           NUMERIC(10, 7) NOT NULL,
  lng           NUMERIC(10, 7) NOT NULL,
  address       TEXT,
  date_time     TIMESTAMPTZ  NOT NULL,
  category      VARCHAR(50)  NOT NULL DEFAULT 'general',
  max_attendees INT,
  image_url     TEXT,
  organizer_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_organizer   ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date_time   ON events(date_time);
CREATE INDEX IF NOT EXISTS idx_events_lat_lng     ON events(lat, lng);

-- ─────────────────────────────────────────
--  RSVPs  (junction table)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rsvps (
  id         SERIAL PRIMARY KEY,
  user_id    INT         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  event_id   INT         NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL DEFAULT 'going'
               CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event  ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user   ON rsvps(user_id);

-- ─────────────────────────────────────────
--  Auto-update updated_at trigger
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at  ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
--  Spatial helper view (pure SQL distance)
-- ─────────────────────────────────────────
-- Returns events within <radius_km> of a given point.
-- Usage: SELECT * FROM events_near(40.7128, -74.0060, 10);
CREATE OR REPLACE FUNCTION events_near(
  center_lat  NUMERIC,
  center_lng  NUMERIC,
  radius_km   NUMERIC DEFAULT 25
)
RETURNS TABLE (
  id            INT,
  title         VARCHAR,
  description   TEXT,
  lat           NUMERIC,
  lng           NUMERIC,
  address       TEXT,
  date_time     TIMESTAMPTZ,
  category      VARCHAR,
  max_attendees INT,
  image_url     TEXT,
  organizer_id  INT,
  distance_km   NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id, e.title, e.description, e.lat, e.lng,
    e.address, e.date_time, e.category, e.max_attendees,
    e.image_url, e.organizer_id,
    ROUND(
      6371 * 2 * ASIN(
        SQRT(
          POWER(SIN(RADIANS(e.lat  - center_lat)  / 2), 2) +
          COS(RADIANS(center_lat)) * COS(RADIANS(e.lat)) *
          POWER(SIN(RADIANS(e.lng - center_lng) / 2), 2)
        )
      )::NUMERIC, 2
    ) AS distance_km
  FROM events e
  WHERE
    e.date_time >= NOW()
    AND 6371 * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS(e.lat  - center_lat)  / 2), 2) +
            COS(RADIANS(center_lat)) * COS(RADIANS(e.lat)) *
            POWER(SIN(RADIANS(e.lng - center_lng) / 2), 2)
          )
        ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;