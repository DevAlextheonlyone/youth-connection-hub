'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [areas, setAreas] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('areas')
      .select('*')
      .order('created_at')
      .then(({ data }) => setAreas(data || []))
  }, [])

  return (
    <main style={{ maxWidth: 800, margin: '60px auto' }}>
      <h1>Youth Connection Hub</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>
        Choose a category to start discussing
      </p>

      {areas.length === 0 ? (
        <p>No areas created yet.</p>
      ) : (
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
      )}
    </main>
  )
}
