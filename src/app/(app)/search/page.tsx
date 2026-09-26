import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import {
  Package, MapPin, Truck, Car, Wrench, Users, FileText,
  Building2, ClipboardList, Search as SearchIcon,
} from 'lucide-react'

type Result = {
  type: 'site' | 'asset' | 'delivery' | 'vehicle' | 'ticket' | 'customer' | 'project' | 'task' | 'amc' | 'employee'
  id: string
  title: string
  subtitle?: string
  href: string
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = (searchParams.q || '').trim()
  const supabase = await createClient()

  let results: Result[] = []

  if (q.length >= 2) {
    const like = `%${q}%`

    const [
      sites, assets, deliveries, vehicles, tickets,
      customers, projects, tasks, amc, employees,
    ] = await Promise.all([
      supabase.from('sites')
        .select('id, name, site_code, customer_name')
        .or(`name.ilike.${like},site_code.ilike.${like},customer_name.ilike.${like},address.ilike.${like}`)
        .limit(8),
      supabase.from('assets')
        .select('id, asset_id, name, serial_number, brand')
        .or(`asset_id.ilike.${like},name.ilike.${like},serial_number.ilike.${like},brand.ilike.${like}`)
        .limit(8),
      supabase.from('deliveries')
        .select('id, delivery_id, customer_name')
        .or(`delivery_id.ilike.${like},customer_name.ilike.${like}`)
        .limit(8),
      supabase.from('vehicles')
        .select('id, vehicle_number, make, model')
        .or(`vehicle_number.ilike.${like},make.ilike.${like},model.ilike.${like},registration_number.ilike.${like}`)
        .limit(8),
      supabase.from('technical_tickets')
        .select('id, ticket_number, title')
        .or(`ticket_number.ilike.${like},title.ilike.${like},problem_description.ilike.${like}`)
        .limit(8),
      supabase.from('customers')
        .select('id, company_name, customer_code, contact_person')
        .or(`company_name.ilike.${like},customer_code.ilike.${like},contact_person.ilike.${like}`)
        .limit(8),
      supabase.from('projects')
        .select('id, project_code, name, customer_name')
        .or(`project_code.ilike.${like},name.ilike.${like},customer_name.ilike.${like}`)
        .limit(8),
      supabase.from('tasks')
        .select('id, title, status')
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(8),
      supabase.from('amc_contracts')
        .select('id, contract_number, customer_name')
        .or(`contract_number.ilike.${like},customer_name.ilike.${like}`)
        .limit(8),
      supabase.from('profiles')
        .select('id, full_name, email, employee_id, department')
        .or(`full_name.ilike.${like},email.ilike.${like},employee_id.ilike.${like},department.ilike.${like}`)
        .limit(8),
    ])

    sites.data?.forEach((s) => results.push({
      type: 'site', id: s.id, title: s.name,
      subtitle: `${s.site_code || ''} · ${s.customer_name || ''}`,
      href: `/sites/${s.id}`,
    }))

    assets.data?.forEach((a) => results.push({
      type: 'asset', id: a.id, title: `${a.asset_id} — ${a.name}`,
      subtitle: `${a.brand || ''} ${a.serial_number ? '· ' + a.serial_number : ''}`,
      href: `/assets/${a.id}`,
    }))

    deliveries.data?.forEach((d) => results.push({
      type: 'delivery', id: d.id, title: d.delivery_id,
      subtitle: d.customer_name || '',
      href: `/deliveries/${d.id}`,
    }))

    vehicles.data?.forEach((v) => results.push({
      type: 'vehicle', id: v.id, title: v.vehicle_number,
      subtitle: `${v.make || ''} ${v.model || ''}`,
      href: `/vehicles/${v.id}`,
    }))

    tickets.data?.forEach((t) => results.push({
      type: 'ticket', id: t.id, title: `${t.ticket_number} — ${t.title}`,
      subtitle: '',
      href: `/technical/${t.id}`,
    }))

    customers.data?.forEach((c) => results.push({
      type: 'customer', id: c.id, title: c.company_name,
      subtitle: `${c.customer_code || ''} · ${c.contact_person || ''}`,
      href: `/customers`,
    }))

    projects.data?.forEach((p) => results.push({
      type: 'project', id: p.id, title: `${p.project_code} — ${p.name}`,
      subtitle: p.customer_name || '',
      href: `/projects/${p.id}`,
    }))

    tasks.data?.forEach((t) => results.push({
      type: 'task', id: t.id, title: t.title,
      subtitle: `Status: ${t.status}`,
      href: '/tasks',
    }))

    amc.data?.forEach((a) => results.push({
      type: 'amc', id: a.id, title: a.contract_number,
      subtitle: a.customer_name || '',
      href: `/amc/${a.id}`,
    }))

    employees.data?.forEach((e) => results.push({
      type: 'employee', id: e.id, title: e.full_name,
      subtitle: `${e.email} · ${e.department || ''}`,
      href: `/hr/${e.id}`,
    }))
  }

  const iconMap = {
    site:     { Icon: MapPin,        color: 'text-green-600',  bg: 'bg-green-50' },
    asset:    { Icon: Package,       color: 'text-purple-600', bg: 'bg-purple-50' },
    delivery: { Icon: Truck,         color: 'text-orange-600', bg: 'bg-orange-50' },
    vehicle:  { Icon: Car,           color: 'text-slate-600',  bg: 'bg-slate-100' },
    ticket:   { Icon: Wrench,        color: 'text-red-600',    bg: 'bg-red-50' },
    customer: { Icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50' },
    project:  { Icon: Building2,     color: 'text-purple-600', bg: 'bg-purple-50' },
    task:     { Icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    amc:      { Icon: FileText,      color: 'text-blue-600',   bg: 'bg-blue-50' },
    employee: { Icon: Users,         color: 'text-slate-600',  bg: 'bg-slate-100' },
  }

  // Group by type
  const grouped: Record<string, Result[]> = {}
  results.forEach((r) => {
    if (!grouped[r.type]) grouped[r.type] = []
    grouped[r.type].push(r)
  })

  return (
    <div>
      <PageHeader
        title="Search Results"
        subtitle={
          q
            ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
            : 'Type at least 2 characters in the top search bar'
        }
      />

      {!q && (
        <div className="bg-white border rounded-lg p-12 text-center">
          <SearchIcon className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500">Enter a search term above</p>
          <p className="text-xs text-slate-400 mt-2">
            Try: PC-1045, delivery, Dubai, Ahmed, Toyota
          </p>
        </div>
      )}

      {q && q.length < 2 && (
        <div className="bg-white border rounded-lg p-12 text-center text-slate-500">
          Please enter at least 2 characters.
        </div>
      )}

      {q.length >= 2 && results.length === 0 && (
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-slate-500">No results found for "{q}"</p>
          <p className="text-xs text-slate-400 mt-2">
            Try different keywords, or check spelling.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => {
            const { Icon, color, bg } = iconMap[type as keyof typeof iconMap]
            return (
              <div key={type}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Icon size={14} /> {type}s ({items.length})
                </h2>
                <div className="bg-white border rounded-lg divide-y">
                  {items.map((r) => (
                    <Link
                      key={r.id}
                      href={r.href}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50 transition"
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${bg}`}>
                        <Icon size={18} className={color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{r.title}</div>
                        {r.subtitle && (
                          <div className="text-xs text-slate-500 truncate">{r.subtitle}</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex-shrink-0">→</div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}