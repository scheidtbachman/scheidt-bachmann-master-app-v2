import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Truck, Search } from 'lucide-react'

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''

  let request = supabase
    .from('deliveries')
    .select('*, sites(name)')
    .order('created_at', { ascending: false })

  if (query) {
    request = request.or(
      `delivery_id.ilike.%${query}%,customer_name.ilike.%${query}%,delivery_address.ilike.%${query}%`
    )
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: deliveries } = await request

  const statusColor: Record<string, string> = {
    requested:           'bg-slate-100 text-slate-700',
    approved:            'bg-blue-100 text-blue-700',
    preparing:           'bg-purple-100 text-purple-700',
    ready:               'bg-indigo-100 text-indigo-700',
    dispatched:          'bg-orange-100 text-orange-700',
    in_transit:          'bg-orange-200 text-orange-800',
    delivered:           'bg-green-100 text-green-700',
    partially_delivered: 'bg-yellow-100 text-yellow-700',
    returned:            'bg-red-100 text-red-700',
    cancelled:           'bg-slate-200 text-slate-600',
  }

  const priorityColor: Record<string, string> = {
    low:    'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  const statusCounts = deliveries?.reduce((acc: Record<string, number>, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Track all deliveries from warehouse to site"
        actionLabel="New Delivery"
        actionHref="/deliveries/new"
      />

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/deliveries"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({deliveries?.length ?? 0})
        </Link>
        {['requested', 'in_transit', 'delivered', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={`/deliveries?status=${s}`}
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
            placeholder="Search by ID, customer, address..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!deliveries?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Truck className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || statusFilter ? 'No deliveries match your filter' : 'No deliveries yet'}
          </p>
          <Link href="/deliveries/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Create first delivery
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Delivery ID</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Site</th>
                  <th className="text-left px-4 py-3 font-medium">Priority</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/deliveries/${d.id}`} className="text-blue-600 hover:underline font-medium">
                        {d.delivery_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{d.customer_name || '—'}</td>
                    <td className="px-4 py-3">{(d.sites as any)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${priorityColor[d.priority] || ''}`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[d.status] || ''}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(d.created_at).toLocaleDateString()}
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