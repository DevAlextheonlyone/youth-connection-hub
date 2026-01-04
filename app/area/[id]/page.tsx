'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Channel = {
  id: string
  name: string
}

export default function AreaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('channels')
        .select('id, name')
        .eq('area_id', params.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error(error)
      }

      setChannels(data || [])
      setLoading(false)
    }

    load()
  }, [params.id, router])

  if (loading) {
    return <p style={{ padding: 20 }}>Loading…</p>
  }

  return (
    <main style={{ maxWidth: 800, margin: '40px auto' }}>
      <h2>Channels</h2>

      {channels.length === 0 && (
        <p style={{ color: '#777' }}>No channels found</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {channels.map(channel => (
          <li key={channel.id} style={{ marginBottom: 12 }}>
            <Link
              href={`/channel/${channel.id}`}
              style={{
                display: 'block',
                padding: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              {channel.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
