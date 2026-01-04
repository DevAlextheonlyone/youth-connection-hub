import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function AreaPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: area } = await supabase
    .from('areas')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('area_id', params.id)
    .order('created_at')

  if (!area) {
    return <p>Area not found</p>
  }

  return (
    <main style={{ maxWidth: 800, margin: '60px auto' }}>
      <h1>{area.name}</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>
        Choose a channel
      </p>

      {(!channels || channels.length === 0) ? (
        <p>No channels yet.</p>
      ) : (
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
      )}
    </main>
  )
}
