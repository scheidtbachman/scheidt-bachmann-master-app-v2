'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type SiteForm = {
  site_code: string
  name: string
  customer_name: string
  address: string
  capacity: number
  contract_start: string
  contract_end: string
  status: string
  notes: string
}

export default function NewSitePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<SiteForm>({
    site_code: '',
    name: '',
    customer_name: '',
    address: '',
    capacity: 0,
    contract_start: '',
    contract_end: '',
    status: 'upcoming',
    notes: '',
  })

  // Generate site_code on mount (client-only to avoid SSR mismatch)
  useEffect(() => {
    if (!form.site_code) {
      const random = Math.floor(10000 + Math.random() * 90000)
      update('site_code', `SITE-${random}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update<K extends keyof SiteForm>(key: K, value: SiteForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      site_code: form.site_code.trim() || `SITE-${Math.floor(10000 + Math.random() * 90000)}`,
      name: form.name.trim(),
      customer_name: form.customer_name.trim() || null,
      address: form.address.trim() || null,
      capacity: Number(form.capacity) || 0,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      status: form.status,
      notes: form.notes.trim() || null,
      company_id: '00000000-0000-0000-0000-000000000001',
    }

    const { data, error } = await supabase
      .from('sites')
      .insert(payload)
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/sites/${data.id}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="Add Parking Site" subtitle="Create a new parking site profile" />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        {/* Basic info */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SITE CODE — Prominent and auto-filled */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Site Code <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={form.site_code}
                  onChange={(e) => update('site_code', e.target.value)}
                  required
                  placeholder="e.g., SITE-12345"
                  className="flex-1 border rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    update('site_code', `SITE-${Math.floor(10000 + Math.random() * 90000)}`)
                  }
                  className="px-3 border rounded-lg text-sm text-blue-600 hover:bg-blue-50"
                  title="Generate new code"
                >
                  ↻
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Unique identifier — auto-generated, but you can change it.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="e.g., Mall of Emirates Parking"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Input
              label="Customer"
              value={form.customer_name}
              onChange={(v) => update('customer_name', v)}
              placeholder="e.g., Mall of Emirates"
            />
            <Input
              label="Capacity (parking slots)"
              type="number"
              value={String(form.capacity)}
              onChange={(v) => update('capacity', Number(v) || 0)}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Location</h2>
          <Input
            label="Address"
            value={form.address}
            onChange={(v) => update('address', v)}
            placeholder="Full site address"
          />
        </div>

        {/* Contract */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Contract</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contract Start" type="date" value={form.contract_start} onChange={(v) => update('contract_start', v)} />
            <Input label="Contract End" type="date" value={form.contract_end} onChange={(v) => update('contract_end', v)} />
          </div>
        </div>

        {/* Status */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Status</h2>
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full max-w-xs border rounded-lg px-3 py-2 capitalize"
          >
            <option value="upcoming">Upcoming</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
            <option value="problem">Problem</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Notes</h2>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Any additional notes about this site..."
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
            {loading ? 'Creating...' : 'Create Site'}
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