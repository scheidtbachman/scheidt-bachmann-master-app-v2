'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type AMCForm = {
  contract_number: string
  customer_name: string
  site_id: string
  start_date: string
  end_date: string
  service_frequency: string
  contract_value: string
  assigned_team: string
  notes: string
}

export default function NewAMCPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<AMCForm>({
    contract_number: `AMC-${Date.now().toString().slice(-6)}`,
    customer_name: '',
    site_id: '',
    start_date: '',
    end_date: '',
    service_frequency: 'monthly',
    contract_value: '',
    assigned_team: '',
    notes: '',
  })

  useEffect(() => {
    supabase.from('sites').select('id, name').then(({ data }) => setSites(data || []))
  }, [])

  function update<K extends keyof AMCForm>(key: K, value: AMCForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('amc_contracts')
      .insert({
        contract_number: form.contract_number,
        company_id: '00000000-0000-0000-0000-000000000001',
        customer_name: form.customer_name,
        site_id: form.site_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        service_frequency: form.service_frequency || null,
        contract_value: form.contract_value ? Number(form.contract_value) : null,
        assigned_team: form.assigned_team || null,
        notes: form.notes || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/amc')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New AMC Contract" subtitle={`Contract: ${form.contract_number}`} />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Contract Number *" value={form.contract_number} onChange={(v) => update('contract_number', v)} required />
          <Input label="Customer Name *" value={form.customer_name} onChange={(v) => update('customer_name', v)} required />

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
            <label className="block text-sm font-medium mb-1">Service Frequency</label>
            <select
              value={form.service_frequency}
              onChange={(e) => update('service_frequency', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 capitalize"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="biannual">Biannual</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <Input label="Start Date" type="date" value={form.start_date} onChange={(v) => update('start_date', v)} />
          <Input label="End Date" type="date" value={form.end_date} onChange={(v) => update('end_date', v)} />
          <Input label="Contract Value (AED)" type="number" value={form.contract_value} onChange={(v) => update('contract_value', v)} />
          <Input label="Assigned Team" value={form.assigned_team} onChange={(v) => update('assigned_team', v)} placeholder="e.g., AMC Team A" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
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
            {loading ? 'Creating...' : 'Create Contract'}
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
  label, value, onChange, type = 'text', required = false, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}