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
  username: string | null
  role: 'owner' | 'admin' | 'mod' | 'user'
}

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const channelId = params.id as string

  const [posts, setPosts] = useState<Post[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [me, setMe] = useState<Profile | null>(null)

  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('id', session.user.id)
        .single()

      setMe(myProfile)

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })

      const userIds = [...new Set((postsData || []).map(p => p.user_id))]
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, username, role')
        .in('id', userIds)

      const map: Record<string, Profile> = {}
      profileRows?.forEach(p => (map[p.id] = p))
      setProfiles(map)

      const withImages = await Promise.all(
        (postsData || []).map(async post => {
          if (!post.image_path) return post
          const { data } = await supabase.storage
            .from('images')
            .createSignedUrl(post.image_path, 3600)
          return { ...post, image_url: data?.signedUrl || null }
        })
      )

      setPosts(withImages)
      setLoading(false)
    }

    if (channelId) load()
  }, [channelId, router])

  const canModerate =
    me?.role === 'owner' || me?.role === 'admin' || me?.role === 'mod'

  function badge(role?: string) {
    if (role === 'owner') return '👑'
    if (role === 'admin') return '🛡️'
    if (role === 'mod') return '🔑'
    return ''
  }

  async function createPost() {
    if (!content.trim() && !image) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let imagePath: string | null = null
    if (image) {
      const ext = image.name.split('.').pop()
      const name = `${crypto.randomUUID()}.${ext}`
      await supabase.storage.from('images').upload(name, image)
      imagePath = name
    }

    await supabase.from('posts').insert({
      channel_id: channelId,
      user_id: session.user.id,
      content,
      image_path: imagePath,
    })

    setContent('')
    setImage(null)
  }

  async function reportPost(postId: string) {
    const reason = prompt('Why are you reporting this post?')
    if (!reason) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('reports').insert({
      post_id: postId,
      reported_by: session.user.id,
      reason,
    })

    alert('Report sent. Thank you.')
  }

  async function deletePost(id: string) {
    await supabase.from('posts').delete().eq('id', id)
    setPosts(p => p.filter(x => x.id !== id))
  }

  async function saveEdit(id: string) {
    await supabase.from('posts').update({ content: editingText }).eq('id', id)
    setPosts(p => p.map(x => (x.id === id ? { ...x, content: editingText } : x)))
    setEditingId(null)
    setEditingText('')
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
        <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
        <button onClick={createPost}>Post</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map(post => {
          const p = profiles[post.user_id]
          return (
            <li key={post.id} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
              <strong>
                {p?.username || 'User'} {badge(p?.role)}
              </strong>

              {post.image_url && (
                <img src={post.image_url} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />
              )}

              {editingId === post.id ? (
                <>
                  <textarea
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    style={{ width: '100%', minHeight: 60 }}
                  />
                  <button onClick={() => saveEdit(post.id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <p>{post.content}</p>
              )}

              <small>{new Date(post.created_at).toLocaleString()}</small>

              {/* 👇 REPORT – ALL USERS */}
              <div style={{ marginTop: 6 }}>
                <button onClick={() => reportPost(post.id)}>Report</button>

                {/* 👇 MODERATION – ONLY MOD/ADMIN/OWNER */}
                {canModerate && (
                  <>
                    <button
                      onClick={() => { setEditingId(post.id); setEditingText(post.content) }}
                      style={{ marginLeft: 8 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      style={{ color: 'red', marginLeft: 8 }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
