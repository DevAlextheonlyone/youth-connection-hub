'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AreaPage({ params }: { params: { id: string } }) {
  const [area, setArea] = useState<any>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select('*')
        .eq('id', params.id)
        .single()

      const { data: channelData } = await supabase
        .from('channels')
        .select('*')
        .eq('area_id', params.id)

      console.log('AREA', areaData, areaError)

      setArea(areaData)
      setChannels(channelData || [])
      setLoading(false)
    }

    load()
  }, [params.id])

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>
  if (!area) return <p style={{ padding: 20 }}>Area not found</p>

  return (
    <main style={{ maxWidth: 800, margin: '60px auto' }}>
      <h1>{area.name}</h1>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {channels.map(channel => (
          <li key={channel.id} style={{ marginBottom: 15 }}>
            <Link
              href={`/channel/${channel.id}`}
              style={{
                display: 'block',
                padding: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                textDecoration: 'none',
                color: '#000',
              }}
            >
              #{channel.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
