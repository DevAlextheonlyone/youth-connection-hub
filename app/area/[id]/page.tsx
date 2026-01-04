'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Channel = {
  id: string
  name: string
}

export default function AreaPage() {
  const router = useRouter()
  const params = useParams()
  const areaId = params.id as string

  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      console.log('AREA ID PARAM', areaId)

      if (!areaId) {
        console.error('Area ID is missing')
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('channels')
        .select('id, name')
        .eq('area_id', areaId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('CHANNEL ERROR', error)
      } else {
        console.log('CHANNEL DATA', data)
        setChannels(data || [])
      }

      setLoading(false)
    }

    load()
  }, [areaId, router])

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

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
                fontWeight: 'bold',
                textDecoration: 'none',
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
