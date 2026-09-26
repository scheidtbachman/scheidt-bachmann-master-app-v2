import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import Link from 'next/link'
import { Truck, Car, Package, Warehouse, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

export default async function LogisticsPage() {
  const supabase = await createClient()

  const [
    { count: inTransit },
    { count: pending },
    { count: delivered },
    { count: vehicles },
    { count: availableVehicles },
    { count: lowStock },
    { count: assetsAtSite },
    { count: assetsInTransit },
  ] = await Promise.all([
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'in_transit'),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'requested'),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('warehouse_items').select('*', { count: 'exact', head: true }),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('location_type', 'site'),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('location_type', 'transit'),
  ])

  // Recent movements
  const { data: recentDeliveries } = await supabase
    .from('deliveries')
    .select('id, delivery_id, customer_name, status, priority, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: recentVehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_number, make, model, status')
    .eq('status', 'active')
    .limit(6)

  return (
    <div>
      <PageHeader
        title="Logistics Control Center"
        subtitle="Everything moving, right now"
      />

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="In Transit"        value={inTransit ?? 0}         icon={Truck}         color="orange" href="/deliveries?status=in_transit" />
        <StatCard label="Pending"           value={pending ?? 0}           icon={Clock}         color="blue"   href="/deliveries?status=requested" />
        <StatCard label="Delivered"         value={delivered ?? 0}         icon={CheckCircle2}  color="green"  href="/deliveries?status=delivered" />
        <StatCard label="Assets In Transit" value={assetsInTransit ?? 0}   icon={Package}       color="purple" href="/assets" />
        <StatCard label="Active Vehicles"   value={availableVehicles ?? 0} icon={Car}           color="green"  href="/vehicles" />
        <StatCard label="Total Vehicles"    value={vehicles ?? 0}          icon={Car}           color="slate"  href="/vehicles" />
        <StatCard label="Warehouse Items"   value={lowStock ?? 0}          icon={Warehouse}     color="blue"   href="/warehouse" />
        <StatCard label="Assets at Sites"   value={assetsAtSite ?? 0}      icon={Package}       color="purple" href="/assets" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent deliveries */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Truck size={18} /> Recent Deliveries
            </h2>
            <Link href="/deliveries" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="p-2">
            {recentDeliveries?.length ? (
              recentDeliveries.map((d) => (
                <Link
                  key={d.id}
                  href={`/deliveries/${d.id}`}
                  className="flex items-center justify-between p-3 rounded hover:bg-slate-50 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium text-sm">{d.delivery_id}</div>
                    <div className="text-xs text-slate-500">{d.customer_name || '—'}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                    d.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    d.status === 'in_transit' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">No deliveries</div>
            )}
          </div>
        </div>

        {/* Active vehicles */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Car size={18} /> Active Vehicles
            </h2>
            <Link href="/vehicles" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="p-2">
            {recentVehicles?.length ? (
              recentVehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/vehicles/${v.id}`}
                  className="flex items-center justify-between p-3 rounded hover:bg-slate-50 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium text-sm">{v.vehicle_number}</div>
                    <div className="text-xs text-slate-500">{v.make} {v.model}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 capitalize">
                    {v.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">No active vehicles</div>
            )}
          </div>
        </div>
      </div>

      {/* Alert */}
      {(lowStock ?? 0) > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-amber-900">Warehouse Attention</div>
            <div className="text-sm text-amber-700 mt-1">
              Some items are below minimum stock. Review the warehouse to plan replenishment.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}