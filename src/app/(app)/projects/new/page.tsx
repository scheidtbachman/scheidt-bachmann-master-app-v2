'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type ProjectForm = {
  project_code: string
  name: string
  customer_name: string
  site_id: string
  project_manager_id: string
  technical_manager_id: string
  start_date: string
  target_completion: string
  budget: string
  status: string
  description: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sites, setSites] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<ProjectForm>({
    project_code: `PRJ-${Date.now().toString().slice(-6)}`,
    name: '',
    customer_name: '',
    site_id: '',
    project_manager_id: '',
    technical_manager_id: '',
    start_date: '',
    target_completion: '',
    budget: '',
    status: 'planned',
    description: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('sites').select('id, name'),
      supabase.from('profiles').select('id, full_name'),
    ]).then(([sitesRes, profilesRes]) => {
      setSites(sitesRes.data || [])
      setManagers(profilesRes.data || [])
    })
  }, [])

  function update<K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        project_code: form.project_code,
        company_id: '00000000-0000-0000-0000-000000000001',
        name: form.name,
        customer_name: form.customer_name || null,
        site_id: form.site_id || null,
        project_manager_id: form.project_manager_id || null,
        technical_manager_id: form.technical_manager_id || null,
        start_date: form.start_date || null,
        target_completion: form.target_completion || null,
        budget: form.budget ? Number(form.budget) : null,
        status: form.status,
        description: form.description || null,
        progress: 0,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${data.id}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Project" subtitle={`Project: ${form.project_code}`} />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-4xl space-y-6">
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Project Code *" value={form.project_code} onChange={(v) => update('project_code', v)} required />
            <Input label="Project Name *" value={form.name} onChange={(v) => update('name', v)} required />
            <Input label="Customer Name" value={form.customer_name} onChange={(v) => update('customer_name', v)} />
            <div>
              <label className="block text-sm font-medium mb-1">Site</label>
              <select
                value={form.site_id}
                onChange={(e) => update('site_id', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">— Select Site —</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Manager</label>
              <select
                value={form.project_manager_id}
                onChange={(e) => update('project_manager_id', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">— Unassigned —</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Technical Manager</label>
              <select
                value={form.technical_manager_id}
                onChange={(e) => update('technical_manager_id', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">— Unassigned —</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Timeline & Budget</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Start Date" type="date" value={form.start_date} onChange={(v) => update('start_date', v)} />
            <Input label="Target Completion" type="date" value={form.target_completion} onChange={(v) => update('target_completion', v)} />
            <Input label="Budget (AED)" type="number" value={form.budget} onChange={(v) => update('budget', v)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full max-w-xs border rounded-lg px-3 py-2 capitalize"
          >
            <option value="planned">Planned</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project'}
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

function Input({
  label, value, onChange, type = 'text', required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}