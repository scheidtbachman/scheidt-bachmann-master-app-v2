import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import Link from 'next/link'
import {
  Truck, Wrench, Package, Users, Car, Warehouse,
  FileText, Building2, AlertTriangle, CheckCircle2,
} from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { count: totalDeliveries },
    { count: delivered },
    { count: inTransit },
    { count: openTickets },
    { count: resolvedTickets },
    { count: totalAssets },
    { count: assetsAtSite },
    { count: lowStock },
    { count: totalVehicles },
    { count: activeAMC },
    { count: activeProjects },
    { count: totalTasks },
    { count: overdueTasks },
    { count: totalSites },
  ] = await Promise.all([
    supabase.from('deliveries').select('*', { count: 'exact', head: true }),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'in_transit'),
    supabase.from('technical_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'accepted']),
    supabase.from('technical_tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('assets').select('*', { count: 'exact', head: true }),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('location_type', 'site'),
    supabase.from('warehouse_items').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('amc_contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).lt('due_date', new Date().toISOString()).neq('status', 'completed'),
    supabase.from('sites').select('*', { count: 'exact', head: true }),
  ])

  const reports = [
    { title: 'Logistics Report',    description: 'Deliveries, trips, and material movements', icon: Truck,           href: '/deliveries' },
    { title: 'Asset Report',        description: 'Assets by department, site, and status',     icon: Package,          href: '/assets' },
    { title: 'Parking Sites Report', description: 'Active, upcoming, and problem sites',       icon: Building2,        href: '/sites' },
    { title: 'Technical Report',    description: 'Tickets, workload, response time',          icon: Wrench,           href: '/technical' },
    { title: 'AMC Report',          description: 'Active, expiring, and pending visits',      icon: FileText,         href: '/amc' },
    { title: 'Vehicle Report',      description: 'Fuel, mileage, and expiry tracking',        icon: Car,              href: '/vehicles' },
    { title: 'Warehouse Report',    description: 'Stock levels, low-stock, and movement',     icon: Warehouse,        href: '/warehouse' },
    { title: 'Employee Report',     description: 'Attendance, tasks, and site assignments',   icon: Users,            href: '/hr' },
  ]

  return (
    <div>
      <PageHeader title="Reports" subtitle="Company-wide analytics and exports" />

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Deliveries"     value={totalDeliveries ?? 0}  icon={Truck}          color="blue"    href="/deliveries" />
        <StatCard label="In Transit"     value={inTransit ?? 0}        icon={Truck}          color="orange"  href="/deliveries?status=in_transit" />
        <StatCard label="Open Tickets"   value={openTickets ?? 0}      icon={Wrench}         color="red"     href="/technical" />
        <StatCard label="Resolved"       value={resolvedTickets ?? 0}  icon={CheckCircle2}   color="green"   href="/technical?status=resolved" />
        <StatCard label="Total Assets"   value={totalAssets ?? 0}      icon={Package}        color="purple"  href="/assets" />
        <StatCard label="Assets at Site" value={assetsAtSite ?? 0}     icon={Package}        color="blue"    href="/assets" />
        <StatCard label="Low Stock"      value={lowStock ?? 0}         icon={AlertTriangle}  color="orange"  href="/warehouse?low=1" />
        <StatCard label="Vehicles"       value={totalVehicles ?? 0}    icon={Car}            color="slate"   href="/vehicles" />
        <StatCard label="Active AMC"     value={activeAMC ?? 0}        icon={FileText}       color="green"   href="/amc" />
        <StatCard label="Active Projects" value={activeProjects ?? 0}  icon={Building2}      color="purple"  href="/projects" />
        <StatCard label="Overdue Tasks"  value={overdueTasks ?? 0}     icon={AlertTriangle}  color="red"     href="/tasks" />
        <StatCard label="Total Sites"    value={totalSites ?? 0}       icon={Building2}      color="green"   href="/sites" />
      </div>

      {/* Report cards */}
      <div className="bg-white border rounded-lg p-5 md:p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => {
            const Icon = r.icon
            return (
              <Link
                key={r.title}
                href={r.href}
                className="border rounded-lg p-4 hover:shadow-md hover:border-blue-200 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{r.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{r.description}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-6 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          💡 Export to CSV/PDF functionality is coming soon. For now, view the module and use your browser&apos;s print or export options.
        </div>
      </div>
    </div>
  )
}