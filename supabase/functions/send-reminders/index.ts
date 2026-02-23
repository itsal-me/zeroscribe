// Supabase Edge Function: send-reminders
// Deployed to: supabase/functions/send-reminders/index.ts
// Triggered by: cron job daily at 9 AM UTC

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Get all users with their notification preferences
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, notification_email, notification_days_before')
      .eq('notification_email', true)

    if (profilesError) throw profilesError

    let remindersCreated = 0

    for (const profile of profiles || []) {
      const daysAhead = profile.notification_days_before ?? 3

      // Find subscriptions renewing within the notification window
      const today = new Date()
      const targetDate = new Date()
      targetDate.setDate(today.getDate() + daysAhead)

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, name, amount, currency, next_billing_date, billing_cycle')
        .eq('user_id', profile.id)
        .in('status', ['active', 'trial'])
        .eq('next_billing_date', targetDate.toISOString().split('T')[0])

      for (const sub of subscriptions || []) {
        // Check if we already sent a reminder for this renewal
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', profile.id)
          .eq('subscription_id', sub.id)
          .eq('type', 'renewal_reminder')
          .gte('created_at', today.toISOString().split('T')[0])
          .single()

        if (existing) continue

        const currencySymbol = sub.currency === 'USD' ? '$' : sub.currency
        const daysText = daysAhead === 1 ? 'tomorrow' : `in ${daysAhead} days`

        await supabase.from('notifications').insert({
          user_id: profile.id,
          subscription_id: sub.id,
          type: 'renewal_reminder',
          title: `${sub.name} renews ${daysText}`,
          message: `Your ${sub.name} subscription will renew ${daysText} for ${currencySymbol}${sub.amount}. Make sure you\'re prepared.`,
        })

        remindersCreated++
      }

      // Also check for trial subscriptions ending
      const { data: trials } = await supabase
        .from('subscriptions')
        .select('id, name, amount, currency, next_billing_date')
        .eq('user_id', profile.id)
        .eq('status', 'trial')
        .lte('next_billing_date', targetDate.toISOString().split('T')[0])
        .gte('next_billing_date', today.toISOString().split('T')[0])

      for (const trial of trials || []) {
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', profile.id)
          .eq('subscription_id', trial.id)
          .eq('type', 'trial_ending')
          .gte('created_at', today.toISOString().split('T')[0])
          .single()

        if (existing) continue

        await supabase.from('notifications').insert({
          user_id: profile.id,
          subscription_id: trial.id,
          type: 'trial_ending',
          title: `${trial.name} trial ending soon`,
          message: `Your free trial of ${trial.name} is ending. It will convert to a paid subscription soon.`,
        })

        remindersCreated++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: profiles?.length || 0,
        remindersCreated,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-reminders error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
