'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Post = {
  id: string
  content: string
  created_at: string
  user_id: string
}

export default function ChannelPage() {
  const router = useRouter()
  const params = useParams()
  const channelId = params.id as string

  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // kräver inloggning
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // hämta posts
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      }

      setPosts(data || [])
      setLoading(false)
    }

    if (channelId) load()
  }, [channelId, router])

  async function createPost() {
    if (!content.trim()) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('posts').insert({
      channel_id: channelId,
      user_id: session.user.id,
      content,
    })

    if (!error) {
      setContent('')
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
      setPosts(data || [])
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

  return (
    <main style={{ maxWidth: 800, margin: '40px auto' }}>
      <h2>Posts</h2>

      {/* create post */}
      <div style={{ marginBottom: 20 }}>
        <textarea
          placeholder="Write something…"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ width: '100%', minHeight: 80, padding: 10 }}
        />
        <button onClick={createPost} style={{ marginTop: 8 }}>
          Post
        </button>
      </div>

      {/* posts list */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map(post => (
          <li
            key={post.id}
            style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}
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
