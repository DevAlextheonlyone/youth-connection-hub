'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Report = {
  id: string
  post_id: string
  reported_by: string
  reason: string
  created_at: string
}

type Post = {
  id: string
  content: string
}

type Profile = {
  id: string
  role: 'owner' | 'admin' | 'mod' | 'user'
}

export default function ModerationPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [posts, setPosts] = useState<Record<string, Post>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', session.user.id)
        .single()

      if (!profile || !['owner', 'admin', 'mod'].includes(profile.role)) {
        router.push('/')
        return
      }

      const { data: reportRows } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      const postIds = [...new Set((reportRows || []).map(r => r.post_id))]
      const { data: postRows } = await supabase
        .from('posts
