import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/StatCard'
import { Users, MapPin, Package, Truck, Wrench, Car, FileText, CheckCircle2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: employees }, { count: sites }, { count: assets },
    { count: deliveries }, { count: tickets }, { count: vehicles },
    { count: projects }, { count: amc },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('sites').select('*', { count: 'exact', head: true }).eq('status', 'running'),
    supabase.from('assets').select('*', { count: 'exact', head: true }),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['dispatched','in_transit']),
    supabase.from('technical_tickets').select('*', { count: 'exact', head: true }).in('status', ['open','in_progress']),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('amc_contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>
        <p className="text-slate-500 mt-1">Complete visibility of your company operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Employees"    value={employees ?? 0}  icon={Users}        color="blue"   href="/hr" />
        <StatCard label="Active Sites" value={sites ?? 0}      icon={MapPin}       color="green"  href="/sites" />
        <StatCard label="Assets"       value={assets ?? 0}     icon={Package}      color="purple" href="/assets" />
        <StatCard label="Deliveries"   value={deliveries ?? 0} icon={Truck}        color="orange" href="/deliveries" />
        <StatCard label="Open Tickets" value={tickets ?? 0}    icon={Wrench}       color="red"    href="/technical" />
        <StatCard label="Vehicles"     value={vehicles ?? 0}   icon={Car}          color="slate"  href="/vehicles" />
        <StatCard label="Projects"     value={projects ?? 0}   icon={FileText}     color="blue"   href="/projects" />
        <StatCard label="Active AMC"   value={amc ?? 0}        icon={CheckCircle2} color="green"  href="/amc" />
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Welcome</h2>
        <p className="text-sm text-slate-600">
          This dashboard will show real-time counts from your Supabase database.
          Use the sidebar to navigate between modules.
        </p>
      </div>
    </div>
  )
}