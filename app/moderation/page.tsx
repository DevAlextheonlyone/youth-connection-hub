'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

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
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || !['owner', 'admin', 'mod'].includes(profile.role)) {
        router.push('/')
        return
      }

      const { data: notifRows } = await supabase
        .from('mod_notifications')
        .select('*')

      setNotifications(notifRows || [])

      const { data: reportRows } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      setReports(reportRows || [])

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

  async function deletePost(postId: string) {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(p => {
      const copy = { ...p }
      delete copy[postId]
      return copy
    })
  }

  async function toggleHidden(postId: string, hidden: boolean) {
    await supabase.from('posts').update({ hidden: !hidden }).eq('id', postId)
    setPosts(p => ({
      ...p,
      [postId]: { ...p[postId], hidden: !hidden }
    }))
  }

  async function markReportRead(reportId: string) {
    await supabase
      .from('mod_notifications')
      .update({ read: true })
      .eq('report_id', reportId)

    setNotifications(n =>
      n.map(x =>
        x.report_id === reportId ? { ...x, read: true } : x
      )
    )
  }

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto' }}>
      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2>Moderation</h2>
        <ThemeToggle />
      </header>

      {/* REPORTS */}
      {reports.map(r => {
        const post = posts[r.post_id]
        const notif = notifications.find(n => n.report_id === r.id)

        return (
          <div
            key={r.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              background: notif?.read ? 'var(--card)' : '#3f1d1d',
            }}
          >
            <p><strong>Reason:</strong> {r.reason}</p>
            <p><strong>Post:</strong> {post?.content || 'Post not found'}</p>

            {post && (
              <>
                <p>Status: {post.hidden ? 'Hidden' : 'Visible'}</p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`/channel/${post.channel_id}`}>Go to channel</a>

                  <button onClick={() => toggleHidden(post.id, post.hidden)}>
                    {post.hidden ? 'Unhide' : 'Hide'}
                  </button>

                  <button
                    onClick={() => deletePost(post.id)}
                    style={{ color: 'var(--danger)' }}
                  >
                    Delete
                  </button>

                  {!notif?.read && (
                    <button onClick={() => markReportRead(r.id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              </>
            )}

            <small>{new Date(r.created_at).toLocaleString()}</small>
          </div>
        )
      })}
    </main>
  )
}
