'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import { Plus, Trash2 } from 'lucide-react'

type DeliveryForm = {
  customer_name: string
  site_id: string
  delivery_address: string
  priority: string
  scheduled_at: string
  notes: string
}

type DeliveryItem = {
  part_number: string
  description: string
  uom: string
  quantity_required: string
}

export default function NewDeliveryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deliveryId] = useState(`DEL-${Date.now().toString().slice(-6)}`)

  const [form, setForm] = useState<DeliveryForm>({
    customer_name: '',
    site_id: '',
    delivery_address: '',
    priority: 'medium',
    scheduled_at: '',
    notes: '',
  })

  const [items, setItems] = useState<DeliveryItem[]>([
    { part_number: '', description: '', uom: 'PCS', quantity_required: '1' },
  ])

  useEffect(() => {
    supabase.from('sites').select('id, name').then(({ data }) => setSites(data || []))
  }, [])

  function update<K extends keyof DeliveryForm>(key: K, value: DeliveryForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateItem<K extends keyof DeliveryItem>(i: number, key: K, value: DeliveryItem[K]) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)))
  }

  function addItem() {
    setItems((a) => [...a, { part_number: '', description: '', uom: 'PCS', quantity_required: '1' }])
  }

  function removeItem(i: number) {
    setItems((a) => a.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Create the delivery
    const { data: created, error: createErr } = await supabase
      .from('deliveries')
      .insert({
        delivery_id: deliveryId,
        company_id: '00000000-0000-0000-0000-000000000001',
        customer_name: form.customer_name || null,
        site_id: form.site_id || null,
        delivery_address: form.delivery_address || null,
        priority: form.priority,
        scheduled_at: form.scheduled_at || null,
        notes: form.notes || null,
        status: 'requested',
      })
      .select()
      .single()

    if (createErr || !created) {
      setError(createErr?.message || 'Failed to create delivery')
      setLoading(false)
      return
    }

    // 2. Create items
    const itemsPayload = items
      .filter((i) => i.description.trim())
      .map((i) => ({
        delivery_id: created.id,
        part_number: i.part_number || null,
        description: i.description,
        uom: i.uom,
        quantity_required: Number(i.quantity_required) || 0,
      }))

    if (itemsPayload.length) {
      const { error: itemErr } = await supabase.from('delivery_items').insert(itemsPayload)
      if (itemErr) {
        console.error('Item insert failed:', itemErr.message)
      }
    }

    router.push(`/deliveries/${created.id}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Delivery" subtitle={`Delivery ID: ${deliveryId}`} />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Delivery details */}
        <div className="bg-white border rounded-lg p-5 md:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Delivery Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Customer Name" value={form.customer_name} onChange={(v) => update('customer_name', v)} />
            <div>
              <label className="block text-sm font-medium mb-1">Site</label>
              <select
                value={form.site_id}
                onChange={(e) => update('site_id', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">— Select Site —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Input label="Delivery Address" value={form.delivery_address} onChange={(v) => update('delivery_address', v)} />
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
            <Input label="Scheduled At" type="datetime-local" value={form.scheduled_at} onChange={(v) => update('scheduled_at', v)} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border rounded-lg p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Delivery Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Part No.</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-left px-3 py-2 font-medium">UoM</th>
                  <th className="text-left px-3 py-2 font-medium">Qty Required</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">
                      <input
                        value={it.part_number}
                        onChange={(e) => updateItem(i, 'part_number', e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={it.uom}
                        onChange={(e) => updateItem(i, 'uom', e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option>PCS</option><option>BOX</option><option>SET</option><option>MTR</option><option>KG</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={it.quantity_required}
                        onChange={(e) => updateItem(i, 'quantity_required', e.target.value)}
                        className="w-24 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Delivery'}
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
  label, value, onChange, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  )
}