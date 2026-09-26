'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type TicketForm = {
  title: string
  problem_description: string
  site_id: string
  asset_id: string
  priority: string
  assigned_technician_id: string
}

export default function NewTicketPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sites, setSites] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticketNumber] = useState(`TK-${Date.now().toString().slice(-6)}`)

  const [form, setForm] = useState<TicketForm>({
    title: '',
    problem_description: '',
    site_id: '',
    asset_id: '',
    priority: 'medium',
    assigned_technician_id: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('sites').select('id, name'),
      supabase.from('assets').select('id, asset_id, name').limit(500),
      supabase.from('profiles').select('id, full_name'),
    ]).then(([sitesRes, assetsRes, techRes]) => {
      setSites(sitesRes.data || [])
      setAssets(assetsRes.data || [])
      setTechnicians(techRes.data || [])
    })
  }, [])

  function update<K extends keyof TicketForm>(key: K, value: TicketForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('technical_tickets')
      .insert({
        ticket_number: ticketNumber,
        company_id: '00000000-0000-0000-0000-000000000001',
        title: form.title,
        problem_description: form.problem_description || null,
        site_id: form.site_id || null,
        asset_id: form.asset_id || null,
        priority: form.priority,
        assigned_technician_id: form.assigned_technician_id || null,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/technical/${data.id}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Technical Ticket" subtitle={`Ticket: ${ticketNumber}`} />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            placeholder="e.g., Barrier not opening"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Problem Description</label>
          <textarea
            rows={4}
            value={form.problem_description}
            onChange={(e) => update('problem_description', e.target.value)}
            placeholder="Describe the issue in detail..."
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
            <label className="block text-sm font-medium mb-1">Equipment / Asset</label>
            <select
              value={form.asset_id}
              onChange={(e) => update('asset_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— Select Asset —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.asset_id} — {a.name}</option>
              ))}
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
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assign Technician</label>
            <select
              value={form.assigned_technician_id}
              onChange={(e) => update('assigned_technician_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— Unassigned —</option>
              {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
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
            {loading ? 'Creating...' : 'Create Ticket'}
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