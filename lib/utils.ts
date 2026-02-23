import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'
import type { BillingCycle, Subscription } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy')
}

export function formatDateShort(date: string): string {
  return format(parseISO(date), 'MMM d')
}

export function formatRelativeDate(date: string): string {
  return formatDistanceToNow(parseISO(date), { addSuffix: true })
}

export function getDaysUntilRenewal(date: string): number {
  return differenceInDays(parseISO(date), new Date())
}

export function getMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'daily':
      return amount * 30.44
    case 'weekly':
      return amount * 4.33
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'yearly':
      return amount / 12
    default:
      return amount
  }
}

export function getAnnualAmount(amount: number, cycle: BillingCycle): number {
  return getMonthlyAmount(amount, cycle) * 12
}

export function getTotalMonthlySpend(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .reduce((total, sub) => total + getMonthlyAmount(sub.amount, sub.billing_cycle), 0)
}

export function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  }
  return labels[cycle]
}

export function getRenewalUrgency(date: string): 'overdue' | 'urgent' | 'soon' | 'normal' {
  const days = getDaysUntilRenewal(date)
  if (days < 0) return 'overdue'
  if (days <= 1) return 'urgent'
  if (days <= 7) return 'soon'
  return 'normal'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'success'
    case 'trial':
      return 'warning'
    case 'paused':
      return 'muted'
    case 'cancelled':
      return 'danger'
    default:
      return 'muted'
  }
}

export function generateServiceLogo(name: string): string {
  const knownLogos: Record<string, string> = {
    netflix: 'https://logo.clearbit.com/netflix.com',
    spotify: 'https://logo.clearbit.com/spotify.com',
    apple: 'https://logo.clearbit.com/apple.com',
    amazon: 'https://logo.clearbit.com/amazon.com',
    google: 'https://logo.clearbit.com/google.com',
    microsoft: 'https://logo.clearbit.com/microsoft.com',
    adobe: 'https://logo.clearbit.com/adobe.com',
    dropbox: 'https://logo.clearbit.com/dropbox.com',
    slack: 'https://logo.clearbit.com/slack.com',
    notion: 'https://logo.clearbit.com/notion.so',
    figma: 'https://logo.clearbit.com/figma.com',
    github: 'https://logo.clearbit.com/github.com',
    zoom: 'https://logo.clearbit.com/zoom.us',
    discord: 'https://logo.clearbit.com/discord.com',
    hulu: 'https://logo.clearbit.com/hulu.com',
    disneyplus: 'https://logo.clearbit.com/disneyplus.com',
    youtube: 'https://logo.clearbit.com/youtube.com',
    twitch: 'https://logo.clearbit.com/twitch.tv',
    linkedin: 'https://logo.clearbit.com/linkedin.com',
  }
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const [key, url] of Object.entries(knownLogos)) {
    if (normalized.includes(key)) return url
  }
  return ''
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const group = String(item[key])
      return { ...groups, [group]: [...(groups[group] || []), item] }
    },
    {} as Record<string, T[]>
  )
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
