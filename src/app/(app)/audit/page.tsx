import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import { FileText } from 'lucide-react'

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Complete record of important activities" />

      {!logs?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500">No audit records yet</p>
          <p className="text-xs text-slate-400 mt-2">
            Audit entries are created automatically when critical actions are performed.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">When</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Table</th>
                  <th className="text-left px-4 py-3 font-medium">Record</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{l.action}</td>
                    <td className="px-4 py-3 text-slate-600">{l.table_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {l.record_id || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}