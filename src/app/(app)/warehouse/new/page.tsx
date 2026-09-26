'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type ItemForm = {
  part_number: string
  description: string
  category: string
  uom: string
  quantity: string
  min_stock: string
  max_stock: string
  rack_location: string
  serial_number: string
  supplier: string
  cost: string
}

export default function NewWarehouseItemPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<ItemForm>({
    part_number: '',
    description: '',
    category: '',
    uom: 'PCS',
    quantity: '0',
    min_stock: '0',
    max_stock: '0',
    rack_location: '',
    serial_number: '',
    supplier: '',
    cost: '',
  })

  function update<K extends keyof ItemForm>(key: K, value: ItemForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('warehouse_items')
      .insert({
        part_number: form.part_number || null,
        description: form.description,
        category: form.category || null,
        uom: form.uom,
        quantity: Number(form.quantity) || 0,
        min_stock: Number(form.min_stock) || 0,
        max_stock: Number(form.max_stock) || 0,
        rack_location: form.rack_location || null,
        serial_number: form.serial_number || null,
        supplier: form.supplier || null,
        cost: form.cost ? Number(form.cost) : null,
        company_id: '00000000-0000-0000-0000-000000000001',
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/warehouse')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="Add Warehouse Item" subtitle="Add a new part or material to inventory" />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Part Number" value={form.part_number} onChange={(v) => update('part_number', v)} placeholder="e.g., PC-BAR-001" />
          <Input label="Description *" value={form.description} onChange={(v) => update('description', v)} required placeholder="e.g., Barrier Motor" />
          <Input label="Category" value={form.category} onChange={(v) => update('category', v)} placeholder="e.g., Spare Parts" />
          <Select
            label="Unit of Measurement"
            value={form.uom}
            onChange={(v) => update('uom', v)}
            options={[
              { value: 'PCS', label: 'Pieces (PCS)' },
              { value: 'BOX', label: 'Box (BOX)' },
              { value: 'SET', label: 'Set (SET)' },
              { value: 'MTR', label: 'Meter (MTR)' },
              { value: 'KG', label: 'Kilogram (KG)' },
              { value: 'LTR', label: 'Liter (LTR)' },
            ]}
          />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Stock Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Initial Quantity" type="number" value={form.quantity} onChange={(v) => update('quantity', v)} />
            <Input label="Minimum Stock" type="number" value={form.min_stock} onChange={(v) => update('min_stock', v)} />
            <Input label="Maximum Stock" type="number" value={form.max_stock} onChange={(v) => update('max_stock', v)} />
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Storage & Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Rack / Location" value={form.rack_location} onChange={(v) => update('rack_location', v)} placeholder="e.g., Rack A-3" />
            <Input label="Serial Number" value={form.serial_number} onChange={(v) => update('serial_number', v)} />
            <Input label="Supplier" value={form.supplier} onChange={(v) => update('supplier', v)} />
            <Input label="Unit Cost (AED)" type="number" value={form.cost} onChange={(v) => update('cost', v)} />
          </div>
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
            {loading ? 'Adding...' : 'Add Item'}
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
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}