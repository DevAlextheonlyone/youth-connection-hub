'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
      // 1️⃣ kräver inloggning
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 2️⃣ hämta area (EXAKT ID)
      const { data: area, error: areaError } = await supabase
        .from('areas')
        .select('id')
        .eq('id', params.id)
        .single()

      if (areaError || !area) {
        setLoading(false)
        return
      }

      // 3️⃣ hämta channels för denna area
      const { data: channelData } = await supabase
        .from('channels')
        .select('*')
        .eq('area_id', area.id)
        .order('created_at', { ascending: true })

      setChannels(channelData || [])
      setLoading(false)
    }

    load()
  }, [params.id, router])

  if (loading) {
    return <p style={{ padding: 20 }}>Loading…</p>
  }

  if (!channels.length) {
    return (
      <main style={{ padding: 40 }}>
        <h2>No channels found</h2>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 800, margin: '40px auto' }}>
      <h2>Channels</h2>

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
