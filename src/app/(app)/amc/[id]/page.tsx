import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { FileText, MapPin, Calendar, Users, DollarSign, Plus } from 'lucide-react'

export default async function AMCDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('amc_contracts')
    .select('*, sites(name, address)')
    .eq('id', params.id)
    .single()

  if (!c) return <div className="p-12 text-center text-slate-500">Contract not found</div>

  const { data: visits } = await supabase
    .from('amc_visits')
    .select('*')
    .eq('amc_id', params.id)
    .order('scheduled_date', { ascending: false })

  const daysLeft = c.end_date
    ? Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  let badgeColor = 'bg-green-100 text-green-700'
  let badgeText = 'Active'
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      badgeColor = 'bg-red-100 text-red-700'
      badgeText = `Expired ${Math.abs(daysLeft)} days ago`
    } else if (daysLeft < 30) {
      badgeColor = 'bg-orange-100 text-orange-700'
      badgeText = `${daysLeft} days left`
    }
  }

  const completed = visits?.filter((v) => v.status === 'completed').length ?? 0
  const pending = visits?.filter((v) => v.status === 'pending').length ?? 0

  return (
    <div>
      <PageHeader title={c.contract_number} subtitle={c.customer_name} />

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</div>
          <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>{badgeText}</span>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <MapPin size={12} /> Site
          </div>
          <div className="text-sm font-medium truncate">{(c.sites as any)?.name || '—'}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <DollarSign size={12} /> Value
          </div>
          <div className="text-sm font-medium">
            {c.contract_value ? `AED ${c.contract_value.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Frequency</div>
          <div className="text-sm font-medium capitalize">{c.service_frequency || '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} /> Contract Details
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Contract #" value={c.contract_number} />
              <Row label="Customer" value={c.customer_name} />
              <Row label="Site" value={(c.sites as any)?.name || '—'} />
              <Row label="Start Date" value={c.start_date || '—'} />
              <Row label="End Date" value={c.end_date || '—'} />
              <Row label="Frequency" value={c.service_frequency || '—'} />
              <Row label="Assigned Team" value={c.assigned_team || '—'} />
              <Row label="Value" value={c.contract_value ? `AED ${c.contract_value.toLocaleString()}` : '—'} />
            </dl>
          </div>

          {c.notes && (
            <div className="mt-6 bg-white border rounded-lg p-5">
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}
        </div>

        {/* Visits */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar size={18} /> Scheduled Visits
              </h2>
              <div className="text-xs text-slate-500">
                {completed} completed · {pending} pending
              </div>
            </div>
            <div className="p-4">
              {visits?.length ? (
                <div className="space-y-3">
                  {visits.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm">
                          {v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString() : '—'}
                        </div>
                        {v.notes && <div className="text-xs text-slate-500 mt-0.5">{v.notes}</div>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        v.status === 'completed' ? 'bg-green-100 text-green-700' :
                        v.status === 'missed' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No visits scheduled yet.
                  <div className="mt-1 text-xs">
                    (Visit scheduling module coming soon)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b last:border-0 border-slate-100">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}