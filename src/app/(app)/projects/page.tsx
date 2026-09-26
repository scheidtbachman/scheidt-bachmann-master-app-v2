import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Building2, Search, AlertTriangle } from 'lucide-react'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const statusFilter = searchParams.status || ''

  let request = supabase
    .from('projects')
    .select('*, sites(name)')
    .order('created_at', { ascending: false })

  if (query) {
    request = request.or(
      `project_code.ilike.%${query}%,name.ilike.%${query}%,customer_name.ilike.%${query}%`
    )
  }
  if (statusFilter) {
    request = request.eq('status', statusFilter)
  }

  const { data: projects } = await request

  const statusColor: Record<string, string> = {
    planned:     'bg-slate-100 text-slate-700',
    approved:    'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    on_hold:     'bg-orange-100 text-orange-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-700',
  }

  const statusCounts = projects?.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const activeCount = (statusCounts['in_progress'] || 0) + (statusCounts['approved'] || 0)
  const totalBudget = projects?.reduce((s, p) => s + (p.budget || 0), 0) || 0

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Track projects from start to handover"
        actionLabel="New Project"
        actionHref="/projects/new"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold">{projects?.length ?? 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Active</div>
          <div className="text-2xl font-bold text-purple-600">{activeCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{statusCounts['completed'] || 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Budget</div>
          <div className="text-lg md:text-2xl font-bold">AED {totalBudget.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/projects"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({projects?.length ?? 0})
        </Link>
        {['planned', 'in_progress', 'on_hold', 'completed'].map((s) => (
          <Link
            key={s}
            href={`/projects?status=${s}`}
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
            placeholder="Search by project code, name, customer..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {!projects?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Building2 className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || statusFilter ? 'No projects match your filter' : 'No projects yet'}
          </p>
          <Link href="/projects/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Create first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="bg-white border rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="text-xs text-blue-600 font-medium">{p.project_code}</div>
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ${statusColor[p.status] || ''}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>

              <div className="text-sm text-slate-600">
                <div>👤 {p.customer_name || '—'}</div>
                <div className="text-xs text-slate-500 truncate">📍 {(p.sites as any)?.name || '—'}</div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{p.progress || 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${p.progress || 0}%` }}
                  />
                </div>
              </div>

              {p.target_completion && (
                <div className="mt-3 pt-3 border-t text-xs text-slate-500">
                  Target: {new Date(p.target_completion).toLocaleDateString()}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}