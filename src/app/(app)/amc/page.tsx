import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { FileText, Search, AlertTriangle, Calendar } from 'lucide-react'

export default async function AMCPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''

  let request = supabase
    .from('amc_contracts')
    .select('*, sites(name)')
    .order('end_date', { ascending: true })

  if (query) {
    request = request.or(
      `contract_number.ilike.%${query}%,customer_name.ilike.%${query}%`
    )
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: contracts } = await request

  function daysUntil(dateStr: string | null) {
    if (!dateStr) return null
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const expiringSoon = contracts?.filter((c) => {
    const d = daysUntil(c.end_date)
    return d !== null && d >= 0 && d < 30
  }).length || 0

  const expired = contracts?.filter((c) => {
    const d = daysUntil(c.end_date)
    return d !== null && d < 0
  }).length || 0

  return (
    <div>
      <PageHeader
        title="AMC Contracts"
        subtitle="Annual maintenance contracts"
        actionLabel="New Contract"
        actionHref="/amc/new"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold">{contracts?.length ?? 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {contracts?.filter((c) => c.status === 'active').length ?? 0}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiring (30d)</div>
          <div className={`text-2xl font-bold ${expiringSoon > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
            {expiringSoon}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expired</div>
          <div className={`text-2xl font-bold ${expired > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {expired}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/amc"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({contracts?.length ?? 0})
        </Link>
        {['active', 'expiring', 'expired', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={`/amc?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
              statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
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
            placeholder="Search by contract # or customer..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!contracts?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || statusFilter ? 'No contracts match your filter' : 'No AMC contracts yet'}
          </p>
          <Link href="/amc/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Create first contract
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((c) => {
            const daysLeft = daysUntil(c.end_date)
            let badgeColor = 'bg-green-100 text-green-700'
            let badgeText = daysLeft === null ? '—' : `${daysLeft} days left`
            if (daysLeft !== null) {
              if (daysLeft < 0) {
                badgeColor = 'bg-red-100 text-red-700'
                badgeText = `Expired ${Math.abs(daysLeft)}d ago`
              } else if (daysLeft < 30) {
                badgeColor = 'bg-orange-100 text-orange-700'
              }
            }

            return (
              <Link
                key={c.id}
                href={`/amc/${c.id}`}
                className="bg-white border rounded-lg p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{c.contract_number}</div>
                    <div className="text-xs text-slate-500 truncate">{c.customer_name}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${badgeColor}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="text-sm text-slate-700">
                  <div className="text-xs text-slate-500">Site</div>
                  {(c.sites as any)?.name || '—'}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <div className="text-slate-400">Start</div>
                    <div>{c.start_date || '—'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">End</div>
                    <div>{c.end_date || '—'}</div>
                  </div>
                </div>

                {c.contract_value && (
                  <div className="mt-3 pt-3 border-t text-xs">
                    <span className="text-slate-500">Value:</span>{' '}
                    <span className="font-semibold">AED {c.contract_value.toLocaleString()}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}