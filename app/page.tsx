'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Area = {
  id: string
  name: string
}

export default function HomePage() {
  const router = useRouter()
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('areas')
        .select('id, name')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('AREAS ERROR', error)
      } else {
        console.log('AREAS DATA', data)
        setAreas(data || [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

  return (
    <main style={{ maxWidth: 800, margin: '40px auto' }}>
      <h1>Youth Connection Hub</h1>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {areas.map(area => (
          <li key={area.id} style={{ marginBottom: 12 }}>
            {/* 🔥 HÄR ÄR DET VIKTIGA */}
            <Link
              href={`/area/${area.id}`}
              style={{
                display: 'block',
                padding: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                fontWeight: 'bold',
                textDecoration: 'none',
                color: '#000',
              }}
            >
              {area.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
