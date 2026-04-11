-- ============================================================
-- Supabase Migration: TikTok Game
-- Paste toàn bộ SQL này vào Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- 1. GIFTS TABLE
CREATE TABLE IF NOT EXISTS gifts (
  gift_id       INTEGER PRIMARY KEY,
  gift_name     TEXT NOT NULL,
  image         TEXT,
  diamonds      INTEGER DEFAULT 0,
  max_repeat_count INTEGER DEFAULT 1,
  active        BOOLEAN DEFAULT true
);

-- 2. MODELS TABLE
CREATE TABLE IF NOT EXISTS models (
  id              TEXT PRIMARY KEY,
  filename        TEXT,
  label           TEXT NOT NULL,
  emoji           TEXT DEFAULT '🚀',
  icon_url        TEXT,
  role            TEXT DEFAULT 'ship',
  path            TEXT,
  scale           REAL DEFAULT 0.25,
  gun_tip_offset  REAL DEFAULT 0.4,
  rotation_y      REAL DEFAULT 0,
  bullet_color    TEXT DEFAULT '#00f5ff',
  damage          INTEGER DEFAULT 1,
  fire_rate       REAL DEFAULT 1.0,
  max_shots       INTEGER DEFAULT 20,
  gifts           JSONB DEFAULT '[]',
  heal_gifts      JSONB DEFAULT '[]',
  shield_gifts    JSONB DEFAULT '[]',
  laser_gifts     JSONB DEFAULT '[]',
  missile_gifts   JSONB DEFAULT '[]',
  nuclear_gifts   JSONB DEFAULT '[]',
  weapons         JSONB DEFAULT '{}',
  heal_amount     INTEGER DEFAULT 3,
  shield_duration INTEGER DEFAULT 5,
  nuclear_kill_count INTEGER DEFAULT 0,
  built_in        BOOLEAN DEFAULT false,
  active          BOOLEAN DEFAULT true,
  trigger_code    TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. TRIGGERS TABLE
CREATE TABLE IF NOT EXISTS triggers (
  id        TEXT PRIMARY KEY,
  type      TEXT NOT NULL,          -- 'comment' | 'tap'
  content   TEXT,
  ship_id   TEXT REFERENCES models(id) ON DELETE SET NULL,
  quantity  INTEGER DEFAULT 1
);

-- 4. Disable RLS (vì dùng service_role key ở backend)
ALTER TABLE gifts    DISABLE ROW LEVEL SECURITY;
ALTER TABLE models   DISABLE ROW LEVEL SECURITY;
ALTER TABLE triggers DISABLE ROW LEVEL SECURITY;
