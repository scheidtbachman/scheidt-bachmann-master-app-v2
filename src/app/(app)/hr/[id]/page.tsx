import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'

export default async function EmployeeDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: e } = await supabase.from('profiles').select('*').eq('id', params.id).single()
  if (!e) return <div>Employee not found</div>

  return (
    <div>
      <PageHeader title={e.full_name} subtitle={e.designation || 'Employee'} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Employee ID', e.employee_id || '—'],
          ['Email', e.email],
          ['Mobile', e.mobile || '—'],
          ['Department', e.department || '—'],
          ['Designation', e.designation || '—'],
          ['Role', e.role],
        ].map(([k, v]) => (
          <div key={k} className="bg-white border rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase">{k}</div>
            <div className="font-semibold mt-1">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}