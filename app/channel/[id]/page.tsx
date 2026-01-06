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

type Profile = {
  id: string
  role: string
}

export default function ChannelPage() {
  const router = useRouter()
  const params = useParams()
  const channelId = params.id as string

  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // hämta profil (roll)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      // hämta posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })

      setPosts(postsData || [])
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
      reloadPosts()
    }
  }

  async function deletePost(postId: string) {
    await supabase.from('posts').delete().eq('id', postId)
    reloadPosts()
  }

  async function reloadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })

    setPosts(data || [])
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
