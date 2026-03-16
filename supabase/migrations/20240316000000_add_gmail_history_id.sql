ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gmail_history_id TEXT;