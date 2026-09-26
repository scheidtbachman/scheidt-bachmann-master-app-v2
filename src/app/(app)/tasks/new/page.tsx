'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type TaskForm = {
  title: string
  description: string
  assigned_to_id: string
  priority: string
  due_date: string
  related_site_id: string
  related_project_id: string
}

export default function NewTaskPage() {
  const router = useRouter()
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<TaskForm>({
    title: '',
    description: '',
    assigned_to_id: '',
    priority: 'medium',
    due_date: '',
    related_site_id: '',
    related_project_id: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, full_name'),
      supabase.from('sites').select('id, name'),
      supabase.from('projects').select('id, name, project_code'),
    ]).then(([usersRes, sitesRes, projectsRes]) => {
      setUsers(usersRes.data || [])
      setSites(sitesRes.data || [])
      setProjects(projectsRes.data || [])
    })
  }, [])

  function update<K extends keyof TaskForm>(key: K, value: TaskForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('tasks')
      .insert({
        company_id: '00000000-0000-0000-0000-000000000001',
        title: form.title,
        description: form.description || null,
        assigned_to_id: form.assigned_to_id || null,
        priority: form.priority,
        due_date: form.due_date || null,
        related_site_id: form.related_site_id || null,
        related_project_id: form.related_project_id || null,
        status: 'new',
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/tasks')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Task" subtitle="Assign a task to a team member" />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            placeholder="e.g., Install barrier at Site ABC"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assign To</label>
            <select
              value={form.assigned_to_id}
              onChange={(e) => update('assigned_to_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— Select Employee —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 capitalize"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => update('due_date', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Related Site</label>
            <select
              value={form.related_site_id}
              onChange={(e) => update('related_site_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— None —</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Related Project</label>
            <select
              value={form.related_project_id}
              onChange={(e) => update('related_project_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-6 py-2.5 rounded-lg text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}