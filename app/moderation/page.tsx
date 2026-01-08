'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Report = {
  id: string
  post_id: string
  reason: string
  created_at: string
}

type Post = {
  id: string
  content: string
  channel_id: string
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
        .select('id, post_id, reason, created_at')
        .order('created_at', { ascending: false })

      const postIds = [...new Set((reportRows || []).map(r => r.post_id))]

      if (postIds.length > 0) {
        const { data: postRows } = await supabase
          .from('posts')
          .select('id, content, channel_id')
          .in('id', postIds)

        const map: Record<string, Post> = {}
        postRows?.forEach(p => (map[p.id] = p))
        setPosts(map)
      }

      setReports(reportRows || [])
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
        {reports.map(r => {
          const post = posts[r.post_id]

          return (
            <li
              key={r.id}
              style={{ borderBottom: '1px solid #ddd', padding: '12px 0' }}
            >
              <p><strong>Reason:</strong> {r.reason}</p>

              <p>
                <strong>Post:</strong>{' '}
                {post?.content || 'Post not found'}
              </p>

              {post && (
                <a
                  href={`/channel/${post.channel_id}`}
                  style={{ color: '#0070f3' }}
                >
                  Go to channel
                </a>
              )}

              <br />
              <small>{new Date(r.created_at).toLocaleString()}</small>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
