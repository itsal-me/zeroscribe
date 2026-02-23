export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  gmail_connected: boolean
  gmail_access_token: string | null
  gmail_refresh_token: string | null
  gmail_token_expiry: string | null
  gmail_last_scanned: string | null
  notification_email: boolean
  notification_days_before: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  is_default: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  description: string | null
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_billing_date: string
  start_date: string | null
  status: SubscriptionStatus
  category_id: string | null
  logo_url: string | null
  website_url: string | null
  notes: string | null
  auto_detected: boolean
  source: 'manual' | 'gmail'
  email_thread_id: string | null
  email_sender: string | null
  created_at: string
  updated_at: string
  categories?: Category
}

export interface Notification {
  id: string
  user_id: string
  subscription_id: string | null
  type: NotificationType
  title: string
  message: string
  read: boolean
  created_at: string
  subscriptions?: Subscription
}

export interface GmailScanLog {
  id: string
  user_id: string
  started_at: string
  completed_at: string | null
  emails_scanned: number
  subscriptions_found: number
  status: 'running' | 'success' | 'failed'
  error_message: string | null
}

export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial'

export type NotificationType =
  | 'renewal_reminder'
  | 'payment_detected'
  | 'trial_ending'
  | 'price_change'

export interface MonthlySpending {
  month: string
  amount: number
}

export interface CategorySpending {
  name: string
  amount: number
  color: string
  count: number
}

export interface DashboardStats {
  totalMonthly: number
  totalAnnual: number
  activeCount: number
  upcomingRenewals: number
  savedThisMonth: number
}

export interface SubscriptionFormData {
  name: string
  description: string
  amount: string
  currency: string
  billing_cycle: BillingCycle
  next_billing_date: string
  start_date: string
  status: SubscriptionStatus
  category_id: string
  website_url: string
  notes: string
}
