'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Post = {
  id: string
  content: string
  created_at: string
  user_id: string
  image_path: string | null
  image_url?: string | null
}

type Profile = {
  id: string
  role: 'owner' | 'admin' | 'mod' | 'user'
}

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const channelId = params.id as string

  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔹 Initial load
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // profile (role)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      // posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })

      // signed URLs for images
      const withImages = await Promise.all(
        (postsData || []).map(async post => {
          if (!post.image_path) return post

          const { data } = await supabase.storage
            .from('images')
            .createSignedUrl(post.image_path, 60 * 60)

          return {
            ...post,
            image_url: data?.signedUrl || null,
          }
        })
      )

      setPosts(withImages)
      setLoading(false)
    }

    if (channelId) load()
  }, [channelId, router])

  // 🔥 REALTIME – new posts
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
        async payload => {
          const post = payload.new as Post

          if (post.image_path) {
            const { data } = await supabase.storage
              .from('images')
              .createSignedUrl(post.image_path, 60 * 60)

            post.image_url = data?.signedUrl || null
          }

          setPosts(prev => [post, ...prev])
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

    let imagePath: string | null = null

    if (image) {
      const ext = image.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, image)

      if (error) {
        alert('Image upload failed')
        return
      }

      imagePath = fileName
    }

    const { error } = await supabase.from('posts').insert({
      channel_id: channelId,
      user_id: session.user.id,
      content,
      image_path: imagePath,
    })

    if (error) {
      alert('Post failed')
      return
    }

    setContent('')
    setImage(null)
  }

  async function deletePost(postId: string) {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const canModerate =
    profile?.role === 'owner' ||
    profile?.role === 'admin' ||
    profile?.role === 'mod'

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

        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] || null)}
        />

        <button onClick={createPost} style={{ marginTop: 8 }}>
          Post
        </button>
      </div>

      {/* posts */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map(post => (
          <li
            key={post.id}
            style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}
          >
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post image"
                style={{
                  maxWidth: '100%',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
            )}

            <p style={{ margin: 0 }}>{post.content}</p>

            <small style={{ color: '#888' }}>
              {new Date(post.created_at).toLocaleString()}
            </small>

            {canModerate && (
              <div>
                <button
                  onClick={() => deletePost(post.id)}
                  style={{ color: 'red', marginTop: 6 }}
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
