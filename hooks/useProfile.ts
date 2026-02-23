'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Category } from '@/types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profileData }, { data: categoriesData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('categories').select('*').order('name'),
      ])

      setProfile(profileData)
      setCategories(categoriesData || [])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev))
    }
    return error
  }

  const disconnectGmail = async () => {
    if (!profile) return
    await supabase.from('profiles').update({
      gmail_connected: false,
      gmail_access_token: null,
      gmail_refresh_token: null,
      gmail_token_expiry: null,
    }).eq('id', profile.id)
    setProfile((prev) => prev ? { ...prev, gmail_connected: false } : prev)
  }

  return {
    profile,
    categories,
    loading,
    refresh: fetchProfile,
    updateProfile,
    disconnectGmail,
  }
}
