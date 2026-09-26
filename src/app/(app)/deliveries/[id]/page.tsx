import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import { Truck, User, MapPin, Calendar, CheckCircle2, Package } from 'lucide-react'

export default async function DeliveryDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: d } = await supabase
    .from('deliveries')
    .select('*, sites(name, address)')
    .eq('id', params.id)
    .single()

  if (!d) return <div className="p-12 text-center text-slate-500">Delivery not found</div>

  const { data: items } = await supabase
    .from('delivery_items')
    .select('*')
    .eq('delivery_id', params.id)

  const totalRequired = items?.reduce((s, i) => s + (i.quantity_required || 0), 0) ?? 0
  const totalDelivered = items?.reduce((s, i) => s + (i.quantity_delivered || 0), 0) ?? 0
  const totalPending = totalRequired - totalDelivered

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

  return (
    <div>
      <PageHeader
        title={d.delivery_id}
        subtitle={`${d.customer_name || 'No customer'} · ${d.status.replace('_', ' ')}`}
      />

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Truck size={12} /> Status
          </div>
          <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[d.status] || ''}`}>
            {d.status.replace('_', ' ')}
          </span>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <MapPin size={12} /> Site
          </div>
          <div className="text-sm font-medium truncate">{(d.sites as any)?.name || '—'}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Calendar size={12} /> Scheduled
          </div>
          <div className="text-sm font-medium">
            {d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : '—'}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Priority</div>
          <div className="text-sm font-medium capitalize">{d.priority}</div>
        </div>
      </div>

      {/* Delivery document */}
      <div className="bg-white border rounded-lg overflow-hidden mb-6">
        <div className="p-5 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Package size={18} /> Delivery Document
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {d.delivery_id} · {new Date(d.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Part No.</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">UoM</th>
                <th className="text-right px-4 py-3 font-medium">Required</th>
                <th className="text-right px-4 py-3 font-medium">Delivered</th>
                <th className="text-right px-4 py-3 font-medium">Still To Deliver</th>
              </tr>
            </thead>
            <tbody>
              {items?.length ? (
                items.map((i) => {
                  const pending = (i.quantity_required || 0) - (i.quantity_delivered || 0)
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="px-4 py-3 font-mono text-xs">{i.part_number || '—'}</td>
                      <td className="px-4 py-3">{i.description}</td>
                      <td className="px-4 py-3 text-slate-600">{i.uom}</td>
                      <td className="px-4 py-3 text-right">{i.quantity_required}</td>
                      <td className="px-4 py-3 text-right">{i.quantity_delivered}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${pending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {pending}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No items added to this delivery
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2">
              <tr className="text-sm font-semibold">
                <td colSpan={3} className="px-4 py-3 text-right">Totals:</td>
                <td className="px-4 py-3 text-right">{totalRequired}</td>
                <td className="px-4 py-3 text-right">{totalDelivered}</td>
                <td className={`px-4 py-3 text-right ${totalPending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {totalPending}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      {d.notes && (
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{d.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1 min-w-[280px]">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-medium text-blue-900 text-sm">Receiver Confirmation</div>
              <div className="text-xs text-blue-700 mt-1">
                Coming soon: Digital signature capture from the receiving party.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}