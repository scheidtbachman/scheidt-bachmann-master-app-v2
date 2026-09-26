import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { ClipboardList, Search } from 'lucide-react'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''

  let request = supabase
    .from('tasks')
    .select('*, profiles!tasks_assigned_to_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (query) {
    request = request.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: tasks } = await request

  const priorityColor: Record<string, string> = {
    low:    'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  const statusColor: Record<string, string> = {
    new:         'bg-slate-100 text-slate-700',
    accepted:    'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    waiting:     'bg-yellow-100 text-yellow-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-700',
  }

  const statusCounts = tasks?.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  function isOverdue(t: any) {
    if (!t.due_date) return false
    if (t.status === 'completed' || t.status === 'cancelled') return false
    return new Date(t.due_date).getTime() < Date.now()
  }

  const overdueCount = tasks?.filter(isOverdue).length || 0

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Assign and track tasks across the company"
        actionLabel="New Task"
        actionHref="/tasks/new"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold">{tasks?.length ?? 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">In Progress</div>
          <div className="text-2xl font-bold text-purple-600">{statusCounts['in_progress'] || 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{statusCounts['completed'] || 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Overdue</div>
          <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/tasks"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({tasks?.length ?? 0})
        </Link>
        {['new', 'in_progress', 'waiting', 'completed'].map((s) => (
          <Link
            key={s}
            href={`/tasks?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
              statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.replace('_', ' ')} ({statusCounts[s] || 0})
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-6 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!tasks?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <ClipboardList className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || statusFilter ? 'No tasks match your filter' : 'No tasks yet'}
          </p>
          <Link href="/tasks/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Create first task
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const overdue = isOverdue(t)
            return (
              <div
                key={t.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-sm transition ${
                  overdue ? 'border-red-200' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900">{t.title}</div>
                    {t.description && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">{t.description}</div>
                    )}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                      <span>👤 {(t.profiles as any)?.full_name || 'Unassigned'}</span>
                      {t.due_date && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          📅 Due {new Date(t.due_date).toLocaleDateString()}
                          {overdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${priorityColor[t.priority] || ''}`}>
                      {t.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ${statusColor[t.status] || ''}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}