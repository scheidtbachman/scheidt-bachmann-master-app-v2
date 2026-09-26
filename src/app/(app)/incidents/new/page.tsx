'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

export default function NewIncidentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [incidentId] = useState(`INC-${Date.now().toString().slice(-6)}`)

  const [form, setForm] = useState({
    title: '',
    description: '',
    site_id: '',
    severity: 'medium',
  })

  useEffect(() => {
    supabase.from('sites').select('id, name').then(({ data }) => setSites(data || []))
  }, [])

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('incidents')
      .insert({
        incident_id: incidentId,
        company_id: '00000000-0000-0000-0000-000000000001',
        title: form.title,
        description: form.description || null,
        site_id: form.site_id || null,
        severity: form.severity,
        reported_by_id: user?.id || null,
        status: 'open',
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/incidents')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="Report Incident" subtitle={`Incident ID: ${incidentId}`} />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            placeholder="e.g., Barrier stuck at entry"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe what happened..."
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => update('severity', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 capitalize"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
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
            {loading ? 'Submitting...' : 'Report Incident'}
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