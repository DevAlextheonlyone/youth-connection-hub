'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ChannelPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [content, setContent] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', params.id)
        .order('created_at', { ascending: false })

      setPosts(data || [])
      setLoading(false)
    }

    load()
  }, [params.id, router])

  async function createPost() {
    if (!content.trim()) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('posts').insert({
      channel_id: params.id,
      user_id: session.user.id,
      content,
    })

    if (!error) {
      setContent('')
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', params.id)
        .order('created_at', { ascending: false })
      setPosts(data || [])
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

  return (
    <main style={{ maxWidth: 800, margin: '40px auto' }}>
      <h2>Posts</h2>

      <div style={{ marginBottom: 20 }}>
        <textarea
          placeholder="Write something…"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ width: '100%', padding: 10, minHeight: 80 }}
        />
        <button onClick={createPost} style={{ marginTop: 10 }}>
          Post
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map(post => (
          <li
            key={post.id}
            style={{
              borderBottom: '1px solid #eee',
              padding: '12px 0',
            }}
          >
            <p style={{ margin: 0 }}>{post.content}</p>
            <small style={{ color: '#888' }}>
              {new Date(post.created_at).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </main>
  )
}
