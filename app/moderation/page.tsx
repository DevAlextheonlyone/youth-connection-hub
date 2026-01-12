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
  hidden: boolean
}

type Notification = {
  id: string
  report_id: string
  read: boolean
}

type Profile = {
  id: string
  role: 'owner' | 'admin' | 'mod' | 'user'
}

export default function ModerationPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [posts, setPosts] = useState<Record<string, Post>>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
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

      // notifications
      const { data: notifRows } = await supabase
        .from('mod_notifications')
        .select('*')
        .order('created_at', { ascending: false })

      setNotifications(notifRows || [])

      // reports
      const { data: reportRows } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      setReports(reportRows || [])

      // posts for reports
      const postIds = [...new Set((reportRows || []).map(r => r.post_id))]

      if (postIds.length > 0) {
        const { data: postRows } = await supabase
          .from('posts')
          .select('id, content, channel_id, hidden')
          .in('id', postIds)

        const map: Record<string, Post> = {}
        postRows?.forEach(p => (map[p.id] = p))
        setPosts(map)
      }

      setLoading(false)
    }

    load()
  }, [router])

  async function markAllRead() {
    await supabase
      .from('mod_notifications')
      .update({ read: true })
      .eq('read', false)

    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>
          Moderation
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 10,
              background: 'red',
              color: 'white',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 12
            }}>
              {unreadCount}
            </span>
          )}
        </h2>

        {unreadCount > 0 && (
          <button onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </header>

      {reports.length === 0 && <p>No reports.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reports.map(r => {
          const post = posts[r.post_id]
          return (
            <li
              key={r.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                background: '#fafafa'
              }}
            >
              <p><strong>Reason:</strong> {r.reason}</p>

              <p>
                <strong>Post:</strong>{' '}
                {post?.content || 'Post not found'}
              </p>

              {post && (
                <>
                  <p>
                    <strong>Status:</strong>{' '}
                    {post.hidden ? 'Hidden' : 'Visible'}
                  </p>

                  <a
                    href={`/channel/${post.channel_id}`}
                    style={{ color: '#0070f3' }}
                  >
                    Go to channel
                  </a>
                </>
              )}

              <p style={{ fontSize: 12, color: '#666' }}>
                {new Date(r.created_at).toLocaleString()}
              </p>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
