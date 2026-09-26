import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Users, Search } from 'lucide-react'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''

  let request = supabase.from('customers').select('*').order('company_name')
  if (query) {
    request = request.or(
      `company_name.ilike.%${query}%,contact_person.ilike.%${query}%,email.ilike.%${query}%,customer_code.ilike.%${query}%`
    )
  }

  const { data: customers } = await request

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Customer directory"
        actionLabel="Add Customer"
        actionHref="/customers/new"
      />

      <form className="mb-6 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!customers?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Users className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query ? 'No customers match your search' : 'No customers yet'}
          </p>
          <Link href="/customers/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Add first customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{c.company_name}</div>
                  <div className="text-xs text-slate-500">{c.customer_code || '—'}</div>
                </div>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                {c.contact_person && <div>👤 {c.contact_person}</div>}
                {c.phone && <div>📞 {c.phone}</div>}
                {c.email && <div className="truncate">📧 {c.email}</div>}
                {c.address && <div className="truncate text-xs">📍 {c.address}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}