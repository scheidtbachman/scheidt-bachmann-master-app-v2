import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Package, MapPin, Wrench, Calendar, Shield, Truck, User } from 'lucide-react'

export default async function AssetDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!asset) {
    return <div className="p-12 text-center text-slate-500">Asset not found</div>
  }

  const { data: movements } = await supabase
    .from('asset_movements')
    .select('*')
    .eq('asset_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

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

  // Warranty status
  let warrantyStatus = '—'
  let warrantyColor = 'text-slate-500'
  if (asset.warranty_expiry) {
    const days = Math.ceil(
      (new Date(asset.warranty_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (days < 0) {
      warrantyStatus = `Expired ${Math.abs(days)} days ago`
      warrantyColor = 'text-red-600'
    } else if (days < 30) {
      warrantyStatus = `${days} days left`
      warrantyColor = 'text-orange-600'
    } else {
      warrantyStatus = `${days} days left`
      warrantyColor = 'text-green-600'
    }
  }

  return (
    <div>
      <PageHeader
        title={`${asset.asset_id} — ${asset.name}`}
        subtitle={`${asset.brand || ''} ${asset.model || ''} · ${asset.category?.replace('_', ' ')}`}
        actionLabel="Edit"
        actionHref={`/assets/${asset.id}/edit`}
      />

      {/* Big info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Package size={12} /> Status
          </div>
          <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[asset.status] || 'bg-slate-100'}`}>
            {asset.status?.replace('_', ' ') || '—'}
          </span>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <MapPin size={12} /> Location
          </div>
          <div className="text-sm font-medium capitalize">
            {asset.location_type?.replace('_', ' ') || '—'}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Shield size={12} /> Condition
          </div>
          <div className="text-sm font-medium capitalize">{asset.current_condition || '—'}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Calendar size={12} /> Warranty
          </div>
          <div className={`text-xs font-medium ${warrantyColor}`}>{warrantyStatus}</div>
        </div>
      </div>

      {/* Details + Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3">Details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Asset ID" value={asset.asset_id} />
              <Row label="Serial Number" value={asset.serial_number || '—'} mono />
              <Row label="Brand" value={asset.brand || '—'} />
              <Row label="Model" value={asset.model || '—'} />
              <Row label="Purchase Date" value={asset.purchase_date || '—'} />
              <Row label="Purchase Price" value={asset.purchase_price ? `AED ${asset.purchase_price}` : '—'} />
              <Row label="Supplier" value={asset.supplier || '—'} />
              <Row label="Warranty Expiry" value={asset.warranty_expiry || '—'} />
            </dl>
          </div>

          {asset.notes && (
            <div className="bg-white border rounded-lg p-5">
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{asset.notes}</p>
            </div>
          )}
        </div>

        {/* Movements history */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Truck size={18} /> Movement History ({movements?.length ?? 0})
              </h2>
            </div>
            <div className="p-4">
              {movements?.length ? (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  <div className="space-y-6">
                    {movements.map((m) => (
                      <div key={m.id} className="relative pl-10">
                        <div className="absolute left-0 top-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">
                            {m.from_location || '—'} → {m.to_location || '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(m.created_at).toLocaleString()}
                          </div>
                          {m.condition && (
                            <div className="text-xs text-slate-600 mt-1">
                              Condition: <span className="capitalize">{m.condition}</span>
                            </div>
                          )}
                          {m.received_by && (
                            <div className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                              <User size={10} /> Received by: {m.received_by}
                            </div>
                          )}
                          {m.notes && (
                            <div className="text-xs text-slate-500 mt-1 italic">{m.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No movements recorded yet. When this asset is transferred, entries will appear here.
                </div>
              )}
            </div>
          </div>

          {/* Related links */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link
              href={`/technical?asset=${asset.id}`}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition flex items-center gap-3"
            >
              <div className="p-2 bg-red-50 rounded-lg">
                <Wrench size={18} className="text-red-600" />
              </div>
              <div>
                <div className="font-medium text-sm">View Tickets</div>
                <div className="text-xs text-slate-500">Technical issues</div>
              </div>
            </Link>
            <Link
              href={`/deliveries?asset=${asset.id}`}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition flex items-center gap-3"
            >
              <div className="p-2 bg-orange-50 rounded-lg">
                <Truck size={18} className="text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-sm">View Deliveries</div>
                <div className="text-xs text-slate-500">Delivery history</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b last:border-0 border-slate-100">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}