import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import TicketActions from '@/components/TicketActions'
import Link from 'next/link'
import { Wrench, MapPin, Package, User, Calendar, CheckCircle2, Circle } from 'lucide-react'

export default async function TicketDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: t } = await supabase
    .from('technical_tickets')
    .select('*, sites(name), assets(asset_id, name)')
    .eq('id', params.id)
    .single()

  if (!t) return <div className="p-12 text-center text-slate-500">Ticket not found</div>

  const { data: technician } = t.assigned_technician_id
    ? await supabase
        .from('profiles')
        .select('full_name, email, mobile')
        .eq('id', t.assigned_technician_id)
        .single()
    : { data: null }

  const statusColor: Record<string, string> = {
    open:          'bg-red-100 text-red-700',
    accepted:      'bg-blue-100 text-blue-700',
    traveling:     'bg-orange-100 text-orange-700',
    in_progress:   'bg-purple-100 text-purple-700',
    waiting_parts: 'bg-yellow-100 text-yellow-700',
    resolved:      'bg-green-100 text-green-700',
    closed:        'bg-slate-200 text-slate-600',
    cancelled:     'bg-slate-100 text-slate-500',
  }

  const priorityColor: Record<string, string> = {
    low:      'bg-slate-100 text-slate-600',
    medium:   'bg-blue-100 text-blue-700',
    high:     'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }

  const workflow = [
    { key: 'open',        label: 'Ticket Created' },
    { key: 'accepted',    label: 'Technician Accepted' },
    { key: 'traveling',   label: 'Traveling to Site' },
    { key: 'in_progress', label: 'Working on Issue' },
    { key: 'resolved',    label: 'Resolved' },
    { key: 'closed',      label: 'Customer Confirmed & Closed' },
  ]

  const currentIdx = workflow.findIndex((w) => w.key === t.status)

  return (
    <div>
      <PageHeader
        title={`${t.ticket_number} — ${t.title}`}
        subtitle={`${t.priority} priority · ${t.status.replace('_', ' ')}`}
      />

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Priority</div>
          <span className={`text-xs px-2 py-1 rounded-full capitalize ${priorityColor[t.priority] || ''}`}>
            {t.priority}
          </span>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</div>
          <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[t.status] || ''}`}>
            {t.status.replace('_', ' ')}
          </span>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <MapPin size={12} /> Site
          </div>
          <div className="text-sm font-medium truncate">{(t.sites as any)?.name || '—'}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Package size={12} /> Equipment
          </div>
          <div className="text-sm font-medium truncate">{(t.assets as any)?.asset_id || '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* ─── ACTIONS PANEL — the new part ─── */}
          <TicketActions
            ticketId={t.id}
            status={t.status as any}
            ticketNumber={t.ticket_number}
          />

          {/* Problem */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Wrench size={18} /> Problem Description
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {t.problem_description || 'No description provided.'}
            </p>
          </div>

          {/* Work done (only shows if resolved) */}
          {t.work_done && (
            <div className="bg-white border rounded-lg p-5">
              <h2 className="font-semibold mb-3">Work Performed</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.work_done}</p>
            </div>
          )}

          {/* Parts used */}
          {t.parts_used && (
            <div className="bg-white border rounded-lg p-5">
              <h2 className="font-semibold mb-3">Parts Used</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.parts_used}</p>
            </div>
          )}

          {/* Customer signature (only shows if closed) */}
          {t.customer_signature && (
            <div className="bg-white border rounded-lg p-5">
              <h2 className="font-semibold mb-3">Customer Confirmation</h2>
              <p className="text-sm text-slate-700">{t.customer_signature}</p>
            </div>
          )}

          {/* Workflow steps */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Technician Workflow</h2>
            <div className="space-y-3">
              {workflow.map((step, i) => {
                const done = i <= currentIdx
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-slate-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${done ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned technician */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <User size={16} /> Assigned Technician
            </h2>
            {technician ? (
              <div>
                <div className="text-sm font-medium">{technician.full_name}</div>
                <div className="text-xs text-slate-500 mt-1">{technician.email}</div>
                {technician.mobile && (
                  <div className="text-xs text-slate-500">📱 {technician.mobile}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400">Not assigned</div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar size={16} /> Timeline
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-right text-xs">
                  {new Date(t.created_at).toLocaleString()}
                </dd>
              </div>
              {t.resolved_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Resolved</dt>
                  <dd className="text-right text-xs">
                    {new Date(t.resolved_at).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Related links */}
          <div className="bg-white border rounded-lg p-5 space-y-2">
            <h2 className="font-semibold mb-2">Related</h2>
            {t.site_id && (
              <Link href={`/sites/${t.site_id}`} className="block text-sm text-blue-600 hover:underline">
                → View Site
              </Link>
            )}
            {t.asset_id && (
              <Link href={`/assets/${t.asset_id}`} className="block text-sm text-blue-600 hover:underline">
                → View Asset
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}