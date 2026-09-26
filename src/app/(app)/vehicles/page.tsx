import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Car, Search, AlertTriangle, Calendar } from 'lucide-react'

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''

  let request = supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  if (query) {
    request = request.or(
      `vehicle_number.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%,registration_number.ilike.%${query}%`
    )
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: vehicles } = await request

  const statusColor: Record<string, string> = {
    active:         'bg-green-100 text-green-700',
    idle:           'bg-slate-100 text-slate-600',
    maintenance:    'bg-orange-100 text-orange-700',
    out_of_service: 'bg-red-100 text-red-700',
  }

  function daysUntil(dateStr: string | null) {
    if (!dateStr) return null
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  // Count alerts
  const expiringSoon = vehicles?.filter((v) => {
    const ins = daysUntil(v.insurance_expiry)
    const reg = daysUntil(v.registration_expiry)
    const srv = daysUntil(v.service_due_date)
    return (ins !== null && ins < 30) || (reg !== null && reg < 30) || (srv !== null && srv < 14)
  }).length || 0

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="Company fleet & expiry tracking"
        actionLabel="Add Vehicle"
        actionHref="/vehicles/new"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Vehicles</div>
          <div className="text-2xl font-bold">{vehicles?.length ?? 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {vehicles?.filter((v) => v.status === 'active').length ?? 0}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiring Soon</div>
          <div className={`text-2xl font-bold ${expiringSoon > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {expiringSoon}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/vehicles"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({vehicles?.length ?? 0})
        </Link>
        {['active', 'idle', 'maintenance', 'out_of_service'].map((s) => (
          <Link
            key={s}
            href={`/vehicles?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
              statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.replace('_', ' ')}
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
            placeholder="Search by vehicle number, make, model..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!vehicles?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Car className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">No vehicles yet</p>
          <Link href="/vehicles/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Add first vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const insDays = daysUntil(v.insurance_expiry)
            const regDays = daysUntil(v.registration_expiry)
            const srvDays = daysUntil(v.service_due_date)
            const hasAlert =
              (insDays !== null && insDays < 30) ||
              (regDays !== null && regDays < 30) ||
              (srvDays !== null && srvDays < 14)

            return (
              <Link
                key={v.id}
                href={`/vehicles/${v.id}`}
                className={`bg-white border rounded-lg p-5 hover:shadow-md transition ${
                  hasAlert ? 'border-orange-300' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-900">{v.vehicle_number}</div>
                    <div className="text-xs text-slate-500">{v.registration_number || '—'}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[v.status] || ''}`}>
                    {v.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-sm text-slate-700">
                  {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  {insDays !== null && (
                    <div className={`flex items-center gap-1 ${insDays < 30 ? 'text-orange-600 font-medium' : 'text-slate-500'}`}>
                      <Calendar size={11} /> Insurance: {insDays < 0 ? 'Expired' : `${insDays} days`}
                    </div>
                  )}
                  {regDays !== null && (
                    <div className={`flex items-center gap-1 ${regDays < 30 ? 'text-orange-600 font-medium' : 'text-slate-500'}`}>
                      <Calendar size={11} /> Registration: {regDays < 0 ? 'Expired' : `${regDays} days`}
                    </div>
                  )}
                  {srvDays !== null && (
                    <div className={`flex items-center gap-1 ${srvDays < 14 ? 'text-orange-600 font-medium' : 'text-slate-500'}`}>
                      <Calendar size={11} /> Service: {srvDays < 0 ? 'Overdue' : `${srvDays} days`}
                    </div>
                  )}
                </div>

                {hasAlert && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-1 text-xs text-orange-600 font-medium">
                    <AlertTriangle size={12} /> Needs attention
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