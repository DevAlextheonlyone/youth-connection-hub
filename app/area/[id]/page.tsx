import { createSupabaseServer } from '@/lib/supabase-server'

export default async function AreaPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createSupabaseServer()

  const areaResult = await supabase
    .from('areas')
    .select('*')
    .eq('id', params.id)

  const channelsResult = await supabase
    .from('channels')
    .select('*')
    .eq('area_id', params.id)

  return (
    <pre style={{ whiteSpace: 'pre-wrap', padding: 20 }}>
      {JSON.stringify(
        {
          paramsId: params.id,
          areaResult,
          channelsResult,
        },
        null,
        2
      )}
    </pre>
  )
}
