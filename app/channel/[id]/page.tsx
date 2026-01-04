'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Post = {
  id: string
  content: string
  image_url: string | null
  created_at: string
  user_id: string
}

export default function ChannelPage() {
  const router = useRouter()
  const params = useParams()
  const channelId = params.id as string

  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)

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
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })

      setPosts(data || [])
      setLoading(false)
    }

    if (channelId) load()
  }, [channelId, router])

  // 🔥 realtime
  useEffect(() => {
    if (!channelId) return

    const channel = supabase
      .channel(`posts-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `channel_id=eq.${channelId}`,
        },
        payload => {
          setPosts(prev => [payload.new as Post, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  async function createPost() {
    if (!content.trim() && !image) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let imageUrl: string | null = null

    if (image) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`

      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, image)

      if (!error) {
        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    }

    await supabase.from('posts').insert({
      channel_id: channelId,
      user_id: session.user.id,
      content,
      image_url: imageUrl,
    })

    setContent('')
    setImage(null)
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
          style={{ width: '100%', minHeight: 80, padding: 10 }}
        />

        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] || null)}
        />

        <button onClick={createPost} style={{ marginTop: 8 }}>
          Post
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map(post => (
          <li
            key={post.id}
            style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}
          >
            <p>{post.content}</p>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post image"
                style={{ maxWidth: '100%', marginTop: 8, borderRadius: 6 }}
              />
            )}

            <small style={{ color: '#888' }}>
              {new Date(post.created_at).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </main>
  )
}
