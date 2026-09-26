'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type SiteForm = {
  site_code: string
  name: string
  customer_name: string
  address: string
  gps_lat: string
  gps_lng: string
  capacity: number
  contract_start: string
  contract_end: string
  status: string
  notes: string
}

export default function EditSitePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState<SiteForm>({
    site_code: '',
    name: '',
    customer_name: '',
    address: '',
    gps_lat: '',
    gps_lng: '',
    capacity: 0,
    contract_start: '',
    contract_end: '',
    status: 'upcoming',
    notes: '',
  })

  useEffect(() => {
    supabase
      .from('sites')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Site not found')
          setInitialLoading(false)
          return
        }
        setForm({
          site_code: data.site_code || '',
          name: data.name || '',
          customer_name: data.customer_name || '',
          address: data.address || '',
          gps_lat: data.gps_lat != null ? String(data.gps_lat) : '',
          gps_lng: data.gps_lng != null ? String(data.gps_lng) : '',
          capacity: data.capacity || 0,
          contract_start: data.contract_start || '',
          contract_end: data.contract_end || '',
          status: data.status || 'upcoming',
          notes: data.notes || '',
        })
        setInitialLoading(false)
      })
  }, [params.id])

  function update<K extends keyof SiteForm>(key: K, value: SiteForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // "Use current location" — reads device GPS and fills lat/lng
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('gps_lat', pos.coords.latitude.toFixed(8))
        update('gps_lng', pos.coords.longitude.toFixed(8))
      },
      (err) => alert('Could not get location: ' + err.message)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('sites')
      .update({
        site_code: form.site_code,
        name: form.name,
        customer_name: form.customer_name || null,
        address: form.address || null,
        gps_lat: form.gps_lat ? Number(form.gps_lat) : null,
        gps_lng: form.gps_lng ? Number(form.gps_lng) : null,
        capacity: Number(form.capacity) || 0,
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        status: form.status,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/sites/${params.id}`)
    router.refresh()
  }

  if (initialLoading) {
    return (
      <div className="p-12 text-center text-slate-500">Loading site...</div>
    )
  }

  return (
    <div>
      <PageHeader title="Edit Parking Site" subtitle={form.name} />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        {/* Basic info */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Site Code *" value={form.site_code} onChange={(v) => update('site_code', v)} required />
            <Input label="Site Name *" value={form.name} onChange={(v) => update('name', v)} required />
            <Input label="Customer" value={form.customer_name} onChange={(v) => update('customer_name', v)} />
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
          <Input label="Address" value={form.address} onChange={(v) => update('address', v)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input label="GPS Latitude" value={form.gps_lat} onChange={(v) => update('gps_lat', v)} placeholder="e.g., 25.2048" />
            <Input label="GPS Longitude" value={form.gps_lng} onChange={(v) => update('gps_lng', v)} placeholder="e.g., 55.2708" />
          </div>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            📍 Use my current location
          </button>
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
            {loading ? 'Saving...' : 'Save Changes'}
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