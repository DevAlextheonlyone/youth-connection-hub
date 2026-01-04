'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('areas')
        .select('*')
        .order('created_at')

      setAreas(data || [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>

  return (
    <main style={{ maxWidth: 800, margin: '60px auto' }}>
      <h1>Youth Connection Hub</h1>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {areas.map(area => (
          <li key={area.id} style={{ marginBottom: 15 }}>
            <Link
              href={`/area/${area.id}`}
              style={{
                display: 'block',
                padding: 20,
                border: '1px solid #ddd',
                borderRadius: 8,
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
