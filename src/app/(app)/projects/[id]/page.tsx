import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Building2, MapPin, User, Calendar, DollarSign, ClipboardList } from 'lucide-react'

export default async function ProjectDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: p } = await supabase
    .from('projects')
    .select('*, sites(name)')
    .eq('id', params.id)
    .single()

  if (!p) return <div className="p-12 text-center text-slate-500">Project not found</div>

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('related_project_id', params.id)
    .order('created_at', { ascending: false })

  const { data: manager } = p.project_manager_id
    ? await supabase.from('profiles').select('full_name').eq('id', p.project_manager_id).single()
    : { data: null }

  const { data: techManager } = p.technical_manager_id
    ? await supabase.from('profiles').select('full_name').eq('id', p.technical_manager_id).single()
    : { data: null }

  const statusColor: Record<string, string> = {
    planned:     'bg-slate-100 text-slate-700',
    approved:    'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    on_hold:     'bg-orange-100 text-orange-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-700',
  }

  const completedTasks = tasks?.filter((t) => t.status === 'completed').length ?? 0
  const totalTasks = tasks?.length ?? 0

  return (
    <div>
      <PageHeader title={p.name} subtitle={`${p.project_code} · ${p.customer_name || 'No customer'}`} />

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</div>
          <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[p.status] || ''}`}>
            {p.status.replace('_', ' ')}
          </span>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <MapPin size={12} /> Site
          </div>
          <div className="text-sm font-medium truncate">{(p.sites as any)?.name || '—'}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <DollarSign size={12} /> Budget
          </div>
          <div className="text-sm font-medium">
            {p.budget ? `AED ${p.budget.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Progress</div>
          <div className="text-sm font-medium">{p.progress || 0}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Project Progress</span>
          <span className="font-semibold">{p.progress || 0}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${p.progress || 0}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Building2 size={16} /> Details
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Project Code" value={p.project_code} />
              <Row label="Customer" value={p.customer_name || '—'} />
              <Row label="Site" value={(p.sites as any)?.name || '—'} />
              <Row label="Start Date" value={p.start_date || '—'} />
              <Row label="Target" value={p.target_completion || '—'} />
              <Row label="Actual Completion" value={p.actual_completion || '—'} />
            </dl>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <User size={16} /> Team
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Project Manager" value={manager?.full_name || 'Unassigned'} />
              <Row label="Technical Manager" value={techManager?.full_name || 'Unassigned'} />
            </dl>
          </div>
        </div>

        {/* Description + Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {p.description && (
            <div className="bg-white border rounded-lg p-5">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.description}</p>
            </div>
          )}

          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <ClipboardList size={18} /> Tasks
              </h2>
              <div className="text-xs text-slate-500">
                {completedTasks} of {totalTasks} completed
              </div>
            </div>
            <div className="p-4">
              {tasks?.length ? (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm">{t.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString()}` : 'No due date'}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        t.status === 'completed' ? 'bg-green-100 text-green-700' :
                        t.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No tasks yet.{' '}
                  <Link href="/tasks/new" className="text-blue-600 hover:underline">
                    Create one →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b last:border-0 border-slate-100">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}