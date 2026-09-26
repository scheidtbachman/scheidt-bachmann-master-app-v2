import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { MapPin, Search, LayoutGrid, Map as MapIcon } from 'lucide-react'
import SitesMap from '@/components/SitesMap'

export default async function SitesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; view?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''
  const view = searchParams.view === 'map' ? 'map' : 'grid'

  let request = supabase.from('sites').select('*').order('created_at', { ascending: false })

  if (query) {
    request = request.or(
      `name.ilike.%${query}%,site_code.ilike.%${query}%,customer_name.ilike.%${query}%,address.ilike.%${query}%`
    )
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: sites } = await request

  const statusColor: Record<string, string> = {
    running:   'bg-green-100 text-green-700 border-green-200',
    upcoming:  'bg-blue-100 text-blue-700 border-blue-200',
    pending:   'bg-orange-100 text-orange-700 border-orange-200',
    problem:   'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-slate-200 text-slate-700 border-slate-300',
    closed:    'bg-slate-300 text-slate-700 border-slate-400',
  }

  const statusCounts = sites?.reduce((acc: Record<string, number>, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { q: query, status: statusFilter, view, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    const qs = params.toString()
    return qs ? `/sites?${qs}` : '/sites'
  }

  return (
    <div>
      <PageHeader
        title="Parking Sites"
        subtitle="Manage all parking locations, contracts & equipment"
        actionLabel="Add Site"
        actionHref="/sites/new"
      />

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href={buildQuery({ status: undefined })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({sites?.length ?? 0})
        </Link>
        {['running', 'upcoming', 'pending', 'problem', 'completed', 'closed'].map((s) => (
          <Link
            key={s}
            href={buildQuery({ status: s })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
              statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s} ({statusCounts[s] || 0})
          </Link>
        ))}
      </div>

      {/* Search + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-2xl">
        <form className="flex-1">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="view" value={view} />
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name, code, customer, address..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* View toggle */}
        <div className="inline-flex border rounded-lg overflow-hidden self-start">
          <Link
            href={buildQuery({ view: 'grid' })}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${
              view === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={14} /> Grid
          </Link>
          <Link
            href={buildQuery({ view: 'map' })}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-l ${
              view === 'map' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MapIcon size={14} /> Map
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {!sites?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <MapPin className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || statusFilter ? 'No sites match your filter' : 'No parking sites yet'}
          </p>
          <Link href="/sites/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Create your first site
          </Link>
        </div>
      ) : view === 'map' ? (
        <SitesMap sites={sites} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((s) => (
            <Link
              key={s.id}
              href={`/sites/${s.id}`}
              className="bg-white border rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.site_code}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border capitalize whitespace-nowrap ${statusColor[s.status] || 'bg-slate-100'}`}>
                  {s.status}
                </span>
              </div>

              <div className="text-sm text-slate-600 space-y-1">
                <div className="truncate">👤 {s.customer_name || '—'}</div>
                <div className="truncate">📍 {s.address || '—'}</div>
                <div>🅿️ Capacity: {s.capacity || 0}</div>
                {s.gps_lat && s.gps_lng && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <MapPin size={10} /> GPS added
                  </div>
                )}
              </div>

              {s.contract_end && (
                <div className="mt-3 pt-3 border-t text-xs text-slate-500">
                  Contract ends: {new Date(s.contract_end).toLocaleDateString()}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}