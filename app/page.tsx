import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'

export default async function HomePage() {
  const supabase = createSupabaseServer()

  const { data: areas } = await supabase
    .from('areas')
    .select('*')
    .order('created_at')

  return (
    <main style={{ maxWidth: 800, margin: '60px auto' }}>
      <h1>Youth Connection Hub</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>
        Choose a category to start discussing
      </p>

      {!areas || areas.length === 0 ? (
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
