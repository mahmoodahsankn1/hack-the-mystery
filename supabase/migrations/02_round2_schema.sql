-- ============================================================
-- MIGRATION 02: ROUND 2 — INTERROGATE
-- Apply in Supabase SQL Editor or via supabase db push
-- ============================================================

-- 1. EXTEND game_state WITH ROUND 2 FIELDS
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS round2_status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (round2_status IN ('waiting', 'active', 'ended')),
  ADD COLUMN IF NOT EXISTS round2_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS round2_duration_minutes INT NOT NULL DEFAULT 6;

-- 2. ROUND 2 SESSIONS TABLE
-- One row per team for Round 2. Stores question count and locked suspect.
CREATE TABLE IF NOT EXISTS public.round2_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  locked_suspect TEXT,
  questions_used INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_team_round2 UNIQUE (team_id)
);

-- 3. ROUND 2 QUESTIONS TABLE
-- One row per accepted question+answer pair.
CREATE TABLE IF NOT EXISTS public.round2_questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  suspect_id       TEXT NOT NULL,
  question_text    TEXT NOT NULL,
  answer_text      TEXT,
  idempotency_key  TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'answered', 'error')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_idempotency_key UNIQUE (idempotency_key)
);

-- 4. ENABLE RLS
ALTER TABLE public.round2_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round2_questions ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES — round2_sessions
DROP POLICY IF EXISTS "Teams read own round2 session" ON public.round2_sessions;
CREATE POLICY "Teams read own round2 session"
  ON public.round2_sessions FOR SELECT
  USING (true);

-- 6. RLS POLICIES — round2_questions
DROP POLICY IF EXISTS "Teams read own round2 questions" ON public.round2_questions;
CREATE POLICY "Teams read own round2 questions"
  ON public.round2_questions FOR SELECT
  USING (true);

-- 7. REALTIME — add round2 tables so UI receives live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.round2_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.round2_questions;

-- 8. ATOMIC HELPER FUNCTION: accept a question credit
-- Called by the Edge Function using service role.
-- Returns: 'ok', 'ok_idempotent', 'no_credits', 'wrong_suspect',
--          'round_not_active', 'deadline_passed'
CREATE OR REPLACE FUNCTION public.accept_round2_question(
  p_team_id        UUID,
  p_suspect_id     TEXT,
  p_idempotency    TEXT,
  p_question_text  TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gs           public.game_state%ROWTYPE;
  v_session      public.round2_sessions%ROWTYPE;
  v_deadline     TIMESTAMPTZ;
  v_existing_id  UUID;
BEGIN
  -- Lock game_state row for the duration of this transaction
  SELECT * INTO v_gs FROM public.game_state WHERE id = 1 FOR UPDATE;

  -- Check round status
  IF v_gs.round2_status != 'active' THEN
    RETURN 'round_not_active';
  END IF;

  -- Server-side deadline check
  v_deadline := v_gs.round2_started_at + (v_gs.round2_duration_minutes * INTERVAL '1 minute');
  IF NOW() > v_deadline THEN
    UPDATE public.game_state SET round2_status = 'ended', updated_at = NOW() WHERE id = 1;
    RETURN 'deadline_passed';
  END IF;

  -- Idempotency: if this key already exists, replay is safe
  SELECT id INTO v_existing_id
  FROM public.round2_questions
  WHERE idempotency_key = p_idempotency;
  IF v_existing_id IS NOT NULL THEN
    RETURN 'ok_idempotent';
  END IF;

  -- Upsert session row
  INSERT INTO public.round2_sessions (team_id, locked_suspect, questions_used)
  VALUES (p_team_id, NULL, 0)
  ON CONFLICT (team_id) DO NOTHING;

  -- Lock session row
  SELECT * INTO v_session
  FROM public.round2_sessions
  WHERE team_id = p_team_id
  FOR UPDATE;

  -- Check question limit
  IF v_session.questions_used >= 3 THEN
    RETURN 'no_credits';
  END IF;

  -- Enforce suspect lock
  IF v_session.locked_suspect IS NOT NULL AND v_session.locked_suspect != p_suspect_id THEN
    RETURN 'wrong_suspect';
  END IF;

  -- Accept: insert pending question + update session atomically
  INSERT INTO public.round2_questions
    (team_id, suspect_id, question_text, idempotency_key, status)
  VALUES
    (p_team_id, p_suspect_id, p_question_text, p_idempotency, 'pending');

  UPDATE public.round2_sessions
  SET
    locked_suspect = p_suspect_id,
    questions_used = questions_used + 1,
    updated_at     = NOW()
  WHERE team_id = p_team_id;

  RETURN 'ok';
END;
$$;
