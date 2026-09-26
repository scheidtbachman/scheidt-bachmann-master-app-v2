import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'

export default async function HRPage() {
  const supabase = await createClient()
  const { data: employees } = await supabase
    .from('profiles').select('*').order('full_name')

  return (
    <div>
      <PageHeader
        title="HR / Employees"
        subtitle="Employee directory & management"
        actionLabel="Add Employee"
        actionHref="/hr/new"
      />

      {!employees?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-slate-500 mb-4">No employees yet.</p>
          <Link href="/hr/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Add your first employee
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((e) => (
            <Link key={e.id} href={`/hr/${e.id}`} className="bg-white border rounded-lg p-5 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  {e.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{e.full_name || 'Unnamed'}</div>
                  <div className="text-xs text-slate-500 truncate">{e.designation || 'Employee'}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div className="truncate">📧 {e.email}</div>
                <div>🏢 {e.department || '—'}</div>
                <div>📱 {e.mobile || '—'}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}