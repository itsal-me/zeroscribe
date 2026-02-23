'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Subscription, SubscriptionFormData } from '@/types'
import toast from 'react-hot-toast'
import { format, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns'

function getNextBillingDate(currentDate: string, cycle: string): string {
  const date = new Date(currentDate)
  switch (cycle) {
    case 'daily':
      return format(addDays(date, 1), 'yyyy-MM-dd')
    case 'weekly':
      return format(addWeeks(date, 1), 'yyyy-MM-dd')
    case 'monthly':
      return format(addMonths(date, 1), 'yyyy-MM-dd')
    case 'quarterly':
      return format(addQuarters(date, 1), 'yyyy-MM-dd')
    case 'yearly':
      return format(addYears(date, 1), 'yyyy-MM-dd')
    default:
      return format(addMonths(date, 1), 'yyyy-MM-dd')
  }
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, categories(*)')
        .order('next_billing_date', { ascending: true })

      if (error) throw error
      setSubscriptions(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscriptions'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSubscriptions()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('subscriptions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSubscriptions((prev) => [
              ...(prev || []),
              payload.new as Subscription,
            ].sort((a, b) =>
              new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime()
            ))
          } else if (payload.eventType === 'UPDATE') {
            setSubscriptions((prev) =>
              (prev || []).map((s) =>
                s.id === payload.new.id ? { ...s, ...payload.new } : s
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setSubscriptions((prev) =>
              (prev || []).filter((s) => s.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSubscriptions, supabase])

  const addSubscription = async (formData: SubscriptionFormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        next_billing_date: formData.next_billing_date,
        start_date: formData.start_date || null,
        status: formData.status,
        category_id: formData.category_id || null,
        website_url: formData.website_url || null,
        notes: formData.notes || null,
        source: 'manual',
        auto_detected: false,
      })

      if (error) throw error
      toast.success('Subscription added')
      await fetchSubscriptions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add subscription'
      toast.error(message)
      throw err
    }
  }

  const updateSubscription = async (id: string, formData: Partial<SubscriptionFormData>) => {
    try {
      const updates: Record<string, unknown> = {}
      if (formData.name !== undefined) updates.name = formData.name
      if (formData.description !== undefined) updates.description = formData.description || null
      if (formData.amount !== undefined) updates.amount = parseFloat(formData.amount)
      if (formData.currency !== undefined) updates.currency = formData.currency
      if (formData.billing_cycle !== undefined) updates.billing_cycle = formData.billing_cycle
      if (formData.next_billing_date !== undefined) updates.next_billing_date = formData.next_billing_date
      if (formData.start_date !== undefined) updates.start_date = formData.start_date || null
      if (formData.status !== undefined) updates.status = formData.status
      if (formData.category_id !== undefined) updates.category_id = formData.category_id || null
      if (formData.website_url !== undefined) updates.website_url = formData.website_url || null
      if (formData.notes !== undefined) updates.notes = formData.notes || null

      const { error } = await supabase.from('subscriptions').update(updates).eq('id', id)
      if (error) throw error
      toast.success('Subscription updated')
      await fetchSubscriptions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subscription'
      toast.error(message)
      throw err
    }
  }

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)
      if (error) throw error
      toast.success('Subscription removed')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete subscription'
      toast.error(message)
      throw err
    }
  }

  const cancelSubscription = async (id: string) => {
    return updateSubscription(id, { status: 'cancelled' })
  }

  const pauseSubscription = async (id: string) => {
    return updateSubscription(id, { status: 'paused' })
  }

  const reactivateSubscription = async (id: string) => {
    return updateSubscription(id, { status: 'active' })
  }

  return {
    subscriptions,
    loading,
    error,
    refresh: fetchSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    pauseSubscription,
    reactivateSubscription,
  }
}
