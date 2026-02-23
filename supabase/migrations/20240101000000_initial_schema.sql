-- ============================================================
-- paySnap - Initial Database Schema
-- Run this in Supabase SQL Editor or via CLI
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  gmail_connected BOOLEAN DEFAULT FALSE,
  gmail_access_token TEXT,         -- stored encrypted / use Vault in production
  gmail_refresh_token TEXT,        -- stored encrypted / use Vault in production
  gmail_token_expiry TIMESTAMPTZ,
  gmail_last_scanned TIMESTAMPTZ,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_days_before INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  icon TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT CHECK (billing_cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  next_billing_date DATE NOT NULL,
  start_date DATE,
  status TEXT CHECK (status IN ('active', 'paused', 'cancelled', 'trial')) DEFAULT 'active',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  logo_url TEXT,
  website_url TEXT,
  notes TEXT,
  auto_detected BOOLEAN DEFAULT FALSE,
  source TEXT CHECK (source IN ('manual', 'gmail')) DEFAULT 'manual',
  email_thread_id TEXT,
  email_sender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('renewal_reminder', 'payment_detected', 'trial_ending', 'price_change')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gmail scan logs
CREATE TABLE IF NOT EXISTS public.gmail_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  emails_scanned INT DEFAULT 0,
  subscriptions_found INT DEFAULT 0,
  status TEXT CHECK (status IN ('running', 'success', 'failed')) DEFAULT 'running',
  error_message TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email_thread_id ON public.subscriptions(email_thread_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_scan_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_delete" ON public.subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Gmail scan logs
CREATE POLICY "gmail_scan_logs_select" ON public.gmail_scan_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert into scan logs (for edge functions)
CREATE POLICY "gmail_scan_logs_service_insert" ON public.gmail_scan_logs
  FOR INSERT WITH CHECK (TRUE);

-- Service role can update scan logs
CREATE POLICY "gmail_scan_logs_service_update" ON public.gmail_scan_logs
  FOR UPDATE USING (TRUE);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Handle new user signup: create profile + default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default categories
  INSERT INTO public.categories (user_id, name, color, icon, is_default)
  VALUES
    (NEW.id, 'Entertainment', '#8B5CF6', 'tv', TRUE),
    (NEW.id, 'Productivity', '#3B82F6', 'briefcase', TRUE),
    (NEW.id, 'Health & Fitness', '#10B981', 'heart', TRUE),
    (NEW.id, 'News & Media', '#F59E0B', 'newspaper', TRUE),
    (NEW.id, 'Cloud Storage', '#6366F1', 'cloud', TRUE),
    (NEW.id, 'Gaming', '#EF4444', 'gamepad', TRUE),
    (NEW.id, 'Finance', '#14B8A6', 'dollar-sign', TRUE),
    (NEW.id, 'AI & Tools', '#EC4899', 'cpu', TRUE),
    (NEW.id, 'Other', '#71717A', 'tag', TRUE)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- CRON JOBS (requires pg_cron extension)
-- ============================================================

-- Send renewal reminders daily at 9 AM UTC
SELECT cron.schedule(
  'send-renewal-reminders',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Auto-scan Gmail every 6 hours
SELECT cron.schedule(
  'scan-gmail-subscriptions',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/scan-gmail',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{"all_users": true}'::jsonb
    );
  $$
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get upcoming renewals for a user
CREATE OR REPLACE FUNCTION public.get_upcoming_renewals(p_user_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (
  subscription_id UUID,
  name TEXT,
  amount NUMERIC,
  currency TEXT,
  next_billing_date DATE,
  days_until INT
) LANGUAGE sql STABLE AS $$
  SELECT
    id,
    name,
    amount,
    currency,
    next_billing_date,
    (next_billing_date - CURRENT_DATE)::INT AS days_until
  FROM public.subscriptions
  WHERE
    user_id = p_user_id
    AND status IN ('active', 'trial')
    AND next_billing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days
  ORDER BY next_billing_date ASC;
$$;
