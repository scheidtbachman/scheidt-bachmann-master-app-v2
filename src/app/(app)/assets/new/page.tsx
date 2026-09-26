'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type AssetForm = {
  asset_id: string
  name: string
  category: string
  serial_number: string
  brand: string
  model: string
  purchase_date: string
  purchase_price: string
  supplier: string
  warranty_expiry: string
  current_condition: string
  status: string
  location_type: string
  notes: string
}

const CATEGORIES = [
  { value: 'parking_controller', label: 'Parking Controller' },
  { value: 'entry_machine', label: 'Entry Machine' },
  { value: 'exit_machine', label: 'Exit Machine' },
  { value: 'barrier', label: 'Barrier' },
  { value: 'ticket_machine', label: 'Ticket Machine' },
  { value: 'intercom', label: 'Intercom' },
  { value: 'intercom_board', label: 'Intercom Board' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'camera', label: 'Camera' },
  { value: 'display', label: 'Display' },
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network Equipment' },
  { value: 'pos', label: 'POS Equipment' },
  { value: 'printer', label: 'Printer' },
  { value: 'lpr', label: 'LPR Equipment' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'cable', label: 'Cables' },
  { value: 'spare_part', label: 'Spare Parts' },
  { value: 'other', label: 'Other' },
]

const STATUSES = [
  'available', 'assigned', 'in_warehouse', 'in_transit', 'at_site',
  'under_repair', 'damaged', 'lost', 'returned', 'disposed', 'reserved',
]

const CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged']

const LOCATION_TYPES = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'site', label: 'Site' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'repair', label: 'Under Repair' },
  { value: 'transit', label: 'In Transit' },
]

export default function NewAssetPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<AssetForm>({
    asset_id: `AST-${Date.now().toString().slice(-6)}`,
    name: '',
    category: 'parking_controller',
    serial_number: '',
    brand: '',
    model: '',
    purchase_date: '',
    purchase_price: '',
    supplier: '',
    warranty_expiry: '',
    current_condition: 'good',
    status: 'available',
    location_type: 'warehouse',
    notes: '',
  })

  function update<K extends keyof AssetForm>(key: K, value: AssetForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('assets')
      .insert({
        asset_id: form.asset_id,
        name: form.name,
        category: form.category,
        serial_number: form.serial_number || null,
        brand: form.brand || null,
        model: form.model || null,
        purchase_date: form.purchase_date || null,
        purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
        supplier: form.supplier || null,
        warranty_expiry: form.warranty_expiry || null,
        current_condition: form.current_condition,
        status: form.status,
        location_type: form.location_type,
        notes: form.notes || null,
        company_id: '00000000-0000-0000-0000-000000000001',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/assets/${data.id}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="Add Asset" subtitle="Register a new company asset" />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-4xl space-y-6">
        {/* Basic info */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Asset ID *" value={form.asset_id} onChange={(v) => update('asset_id', v)} required placeholder="PC-1045" />
            <Input label="Asset Name *" value={form.name} onChange={(v) => update('name', v)} required placeholder="e.g., Entry Barrier Controller" />
            <Select
              label="Category"
              value={form.category}
              onChange={(v) => update('category', v)}
              options={CATEGORIES}
            />
            <Input label="Serial Number" value={form.serial_number} onChange={(v) => update('serial_number', v)} />
            <Input label="Brand" value={form.brand} onChange={(v) => update('brand', v)} />
            <Input label="Model" value={form.model} onChange={(v) => update('model', v)} />
          </div>
        </div>

        {/* Purchase info */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Purchase Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Purchase Date" type="date" value={form.purchase_date} onChange={(v) => update('purchase_date', v)} />
            <Input label="Purchase Price (AED)" type="number" value={form.purchase_price} onChange={(v) => update('purchase_price', v)} />
            <Input label="Supplier" value={form.supplier} onChange={(v) => update('supplier', v)} />
            <Input label="Warranty Expiry" type="date" value={form.warranty_expiry} onChange={(v) => update('warranty_expiry', v)} />
          </div>
        </div>

        {/* Status & location */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Status & Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => update('status', v)}
              options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
            />
            <Select
              label="Condition"
              value={form.current_condition}
              onChange={(v) => update('current_condition', v)}
              options={CONDITIONS.map((c) => ({ value: c, label: c }))}
            />
            <Select
              label="Location Type"
              value={form.location_type}
              onChange={(v) => update('location_type', v)}
              options={LOCATION_TYPES}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Notes</h2>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Any additional notes..."
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Asset'}
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

function Select({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}