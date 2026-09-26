import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import StatCard from '@/components/StatCard'
import { Users, Building2, ShoppingCart, FileText } from 'lucide-react'

export default async function SalesPage() {
  const supabase = await createClient()

  const [
    { count: totalCustomers },
    { count: totalSites },
    { count: activeProjects },
    { count: activeAMC },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('sites').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('amc_contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const { data: recentCustomers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Leads, opportunities & customer pipeline"
        actionLabel="Add Customer"
        actionHref="/customers/new"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Customers"       value={totalCustomers ?? 0} icon={Users}       color="blue"   href="/customers" />
        <StatCard label="Sites"           value={totalSites ?? 0}     icon={Building2}   color="green"  href="/sites" />
        <StatCard label="Active Projects" value={activeProjects ?? 0} icon={ShoppingCart} color="purple" href="/projects" />
        <StatCard label="Active AMC"      value={activeAMC ?? 0}      icon={FileText}    color="orange" href="/amc" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent customers */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Customers</h2>
            <Link href="/customers" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="p-2">
            {recentCustomers?.length ? (
              recentCustomers.map((c) => (
                <div key={c.id} className="p-3 border-b last:border-0">
                  <div className="font-medium text-sm">{c.company_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {c.contact_person || '—'} · {c.phone || '—'}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">
                No customers yet.
                <Link href="/customers/new" className="text-blue-600 ml-1 hover:underline">
                  Add one →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Coming soon: Leads, quotations */}
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Coming Soon</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="border-l-2 border-blue-200 pl-3 py-1">Leads & opportunity tracking</div>
            <div className="border-l-2 border-blue-200 pl-3 py-1">Quotation builder with PDF export</div>
            <div className="border-l-2 border-blue-200 pl-3 py-1">Sales pipeline & follow-up reminders</div>
            <div className="border-l-2 border-blue-200 pl-3 py-1">Purchase orders & contracts</div>
          </div>
          <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            💡 For now, track customers in the <Link href="/customers" className="text-blue-600 hover:underline">Customers</Link> module.
            Full sales workflow is planned for a future release.
          </div>
        </div>
      </div>
    </div>
  )
}