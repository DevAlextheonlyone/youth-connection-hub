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

type Profile = {
  id: string
  role: 'owner' | 'admin' | 'mod' | 'user'
}

export default function ModerationPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
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

      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      setReports(data || [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

  return (
    <main style={{ maxWidth: 900, margin: '40px auto' }}>
      <h2>Moderation – Reports</h2>

      {reports.length === 0 && <p>No reports yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reports.map(r => (
          <li
            key={r.id}
            style={{
              borderBottom: '1px solid #ddd',
              padding: '12px 0',
            }}
          >
            <p><strong>Reason:</strong> {r.reason}</p>
            <small>
              {new Date(r.created_at).toLocaleString()}
            </small>

            <div style={{ marginTop: 6 }}>
              <a href={`/channel/${r.post_id}`} style={{ color: '#0070f3' }}>
                Go to post
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
