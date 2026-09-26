import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Package, Search } from 'lucide-react'

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''

  let request = supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (query) {
    request = request.or(
      `asset_id.ilike.%${query}%,name.ilike.%${query}%,serial_number.ilike.%${query}%,brand.ilike.%${query}%`
    )
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: assets } = await request

  const statusColor: Record<string, string> = {
    available:     'bg-green-100 text-green-700',
    assigned:      'bg-blue-100 text-blue-700',
    in_warehouse:  'bg-slate-100 text-slate-700',
    in_transit:    'bg-orange-100 text-orange-700',
    at_site:       'bg-purple-100 text-purple-700',
    under_repair:  'bg-yellow-100 text-yellow-700',
    damaged:       'bg-red-100 text-red-700',
    lost:          'bg-red-200 text-red-800',
    returned:      'bg-slate-100 text-slate-700',
    disposed:      'bg-slate-200 text-slate-600',
    reserved:      'bg-indigo-100 text-indigo-700',
  }

  const statusCounts = assets?.reduce((acc: Record<string, number>, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div>
      <PageHeader
        title="Asset Management"
        subtitle="Every asset, its location, and its full history"
        actionLabel="Add Asset"
        actionHref="/assets/new"
      />

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/assets"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({assets?.length ?? 0})
        </Link>
        {['available', 'at_site', 'in_warehouse', 'in_transit', 'under_repair', 'damaged'].map((s) => (
          <Link
            key={s}
            href={`/assets?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
              statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.replace('_', ' ')} ({statusCounts[s] || 0})
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-6 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by Asset ID, name, serial, brand..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Empty state */}
      {!assets?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Package className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || statusFilter ? 'No assets match your filter' : 'No assets yet'}
          </p>
          <Link href="/assets/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Add your first asset
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Asset ID</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Serial</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/assets/${a.id}`} className="text-blue-600 hover:underline font-medium">
                        {a.asset_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {a.category?.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {a.serial_number || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[a.status] || 'bg-slate-100'}`}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {a.location_type?.replace('_', ' ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}