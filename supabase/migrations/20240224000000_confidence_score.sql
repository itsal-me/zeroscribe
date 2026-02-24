-- ============================================================
-- Migration: Confidence scoring for Gmail-detected subscriptions
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add confidence_score column (0–95, two decimal places)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5, 2) DEFAULT NULL;

-- 2. Add detection_reason column (pipe-separated signal labels)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS detection_reason TEXT DEFAULT NULL;

-- 3. Expand the status CHECK constraint to allow pending_review
--    (items scored 60–89% are queued here for user approval)
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'paused', 'cancelled', 'trial', 'pending_review'));

-- 4. Partial index so pending_review lookups stay fast
CREATE INDEX IF NOT EXISTS idx_subscriptions_pending
  ON public.subscriptions (user_id, status)
  WHERE status = 'pending_review';
