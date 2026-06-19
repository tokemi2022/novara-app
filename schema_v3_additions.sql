-- ===== NOVARA SCHEMA v3 ADDITIONS =====
-- Run ONLY these additions in Supabase SQL Editor.
-- All previous schema (v1 + v2) must already be applied.

-- ─────────────────────────────────────────────
-- 1. EMAIL VERIFICATION on families table
-- ─────────────────────────────────────────────
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verify_code TEXT,
  ADD COLUMN IF NOT EXISTS verify_code_expires_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────
-- 2. WEEKLY AVAILABILITY — replaces static family_availability
--    One row per family per week so availability is dynamic each week
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  monday      JSONB DEFAULT '{"available": false, "time_slot": null}',
  tuesday     JSONB DEFAULT '{"available": false, "time_slot": null}',
  wednesday   JSONB DEFAULT '{"available": false, "time_slot": null}',
  thursday    JSONB DEFAULT '{"available": false, "time_slot": null}',
  friday      JSONB DEFAULT '{"available": false, "time_slot": null}',
  saturday    JSONB DEFAULT '{"available": true,  "time_slot": "morning"}',
  sunday      JSONB DEFAULT '{"available": true,  "time_slot": "morning"}',
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, week_number)
);
ALTER TABLE weekly_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_weekly_avail" ON weekly_availability FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 3. WAITLIST — email capture for upgrade interest
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upgrade_waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES families(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  joined_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE upgrade_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_waitlist" ON upgrade_waitlist FOR ALL USING (true) WITH CHECK (true);
