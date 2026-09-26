import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Wrench, Search, AlertCircle } from 'lucide-react'

export default async function TechnicalPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''

  let request = supabase
    .from('technical_tickets')
    .select('*, sites(name)')
    .order('created_at', { ascending: false })

  if (query) {
    request = request.or(
      `ticket_number.ilike.%${query}%,title.ilike.%${query}%,problem_description.ilike.%${query}%`
    )
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: tickets } = await request

  const statusColor: Record<string, string> = {
    open:           'bg-red-100 text-red-700',
    accepted:       'bg-blue-100 text-blue-700',
    traveling:      'bg-orange-100 text-orange-700',
    in_progress:    'bg-purple-100 text-purple-700',
    waiting_parts:  'bg-yellow-100 text-yellow-700',
    resolved:       'bg-green-100 text-green-700',
    closed:         'bg-slate-200 text-slate-600',
    cancelled:      'bg-slate-100 text-slate-500',
  }

  const priorityColor: Record<string, string> = {
    low:      'bg-slate-100 text-slate-600',
    medium:   'bg-blue-100 text-blue-700',
    high:     'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }

  const statusCounts = tickets?.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const openCount = (statusCounts['open'] || 0) + (statusCounts['in_progress'] || 0) + (statusCounts['accepted'] || 0)

  return (
    <div>
      <PageHeader
        title="Technical Tickets"
        subtitle="Manage all technical issues & repairs"
        actionLabel="New Ticket"
        actionHref="/technical/new"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold">{tickets?.length ?? 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Open</div>
          <div className="text-2xl font-bold text-red-600">{openCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Resolved</div>
          <div className="text-2xl font-bold text-green-600">{statusCounts['resolved'] || 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Closed</div>
          <div className="text-2xl font-bold text-slate-500">{statusCounts['closed'] || 0}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/technical"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({tickets?.length ?? 0})
        </Link>
        {['open', 'in_progress', 'waiting_parts', 'resolved', 'closed'].map((s) => (
          <Link
            key={s}
            href={`/technical?status=${s}`}
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
            placeholder="Search by ticket #, title, description..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!tickets?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Wrench className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || statusFilter ? 'No tickets match your filter' : 'No tickets yet'}
          </p>
          <Link href="/technical/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Create first ticket
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Ticket #</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Site</th>
                  <th className="text-left px-4 py-3 font-medium">Priority</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/technical/${t.id}`} className="text-blue-600 hover:underline font-medium">
                        {t.ticket_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3">{(t.sites as any)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${priorityColor[t.priority] || ''}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[t.status] || ''}`}>
                        {t.status.replace('_', ' ')}
                      </span>
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