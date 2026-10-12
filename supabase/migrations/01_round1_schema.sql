-- Supabase Schema for HACK THE MYSTERY — THE DIAMOND HEIST (Round 1)

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. GAME CONTROL / STATE TABLE
CREATE TABLE IF NOT EXISTS public.game_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_started BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  round1_duration_minutes INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial game state row if not exists
INSERT INTO public.game_state (id, is_started, round1_duration_minutes)
VALUES (1, FALSE, 15)
ON CONFLICT (id) DO NOTHING;

-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT UNIQUE NOT NULL,
  member1_name TEXT NOT NULL,
  member2_name TEXT NOT NULL,
  passcode TEXT NOT NULL, -- Simple passcode for team auth
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVESTIGATION NOTES TABLE (Per team notes)
CREATE TABLE IF NOT EXISTS public.team_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_team_note UNIQUE (team_id)
);


-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_notes ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES

-- Game State: Read access for everyone, Update access for authenticated Admin
DROP POLICY IF EXISTS "Allow read game state for all" ON public.game_state;
CREATE POLICY "Allow read game state for all" ON public.game_state FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update game state for admin" ON public.game_state;
CREATE POLICY "Allow update game state for admin" ON public.game_state FOR UPDATE USING (true);

-- Teams: Public read basic info, public insert for team registration
DROP POLICY IF EXISTS "Allow read teams" ON public.teams;
CREATE POLICY "Allow read teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert teams" ON public.teams;
CREATE POLICY "Allow insert teams" ON public.teams FOR INSERT WITH CHECK (true);

-- Team Notes: Read/Write by team_id
DROP POLICY IF EXISTS "Allow read notes" ON public.team_notes;
CREATE POLICY "Allow read notes" ON public.team_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert notes" ON public.team_notes;
CREATE POLICY "Allow insert notes" ON public.team_notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update notes" ON public.team_notes;
CREATE POLICY "Allow update notes" ON public.team_notes FOR UPDATE USING (true);

-- 8. REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
