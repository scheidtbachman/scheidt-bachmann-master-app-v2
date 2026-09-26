import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { ShieldAlert, Search } from 'lucide-react'

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: { q?: string; severity?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const severityFilter = searchParams.severity || ''

  let request = supabase
    .from('incidents')
    .select('*, sites(name)')
    .order('created_at', { ascending: false })

  if (query) {
    request = request.or(`incident_id.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`)
  }
  if (severityFilter) {
    request = request.eq('severity', severityFilter)
  }

  const { data: incidents } = await request

  const severityColor: Record<string, string> = {
    low:      'bg-slate-100 text-slate-600',
    medium:   'bg-blue-100 text-blue-700',
    high:     'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }

  const statusColor: Record<string, string> = {
    open:          'bg-red-100 text-red-700',
    investigating: 'bg-orange-100 text-orange-700',
    resolved:      'bg-green-100 text-green-700',
    closed:        'bg-slate-200 text-slate-600',
  }

  return (
    <div>
      <PageHeader
        title="Incidents"
        subtitle="Report & track operational incidents"
        actionLabel="Report Incident"
        actionHref="/incidents/new"
      />

      <form className="mb-6 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search incidents..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!incidents?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <ShieldAlert className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">No incidents reported</p>
          <Link href="/incidents/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Report an incident
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((i) => (
            <div key={i.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{i.incident_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${severityColor[i.severity]}`}>
                      {i.severity}
                    </span>
                  </div>
                  <div className="font-medium text-slate-900 mt-1">{i.title}</div>
                  {i.description && (
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{i.description}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-2">
                    📍 {(i.sites as any)?.name || '—'} · {new Date(i.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ${statusColor[i.status]}`}>
                  {i.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}