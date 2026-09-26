'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

type VehicleForm = {
  vehicle_number: string
  registration_number: string
  make: string
  model: string
  year: string
  status: string
  insurance_expiry: string
  registration_expiry: string
  service_due_date: string
  mileage: string
  fuel_type: string
  current_location: string
  department: string
  notes: string
}

export default function NewVehiclePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<VehicleForm>({
    vehicle_number: '',
    registration_number: '',
    make: '',
    model: '',
    year: '',
    status: 'active',
    insurance_expiry: '',
    registration_expiry: '',
    service_due_date: '',
    mileage: '0',
    fuel_type: 'petrol',
    current_location: '',
    department: '',
    notes: '',
  })

  function update<K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        vehicle_number: form.vehicle_number,
        registration_number: form.registration_number || null,
        make: form.make || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
        status: form.status,
        insurance_expiry: form.insurance_expiry || null,
        registration_expiry: form.registration_expiry || null,
        service_due_date: form.service_due_date || null,
        mileage: form.mileage ? Number(form.mileage) : 0,
        fuel_type: form.fuel_type || null,
        current_location: form.current_location || null,
        department: form.department || null,
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

    router.push('/vehicles')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="Add Vehicle" subtitle="Register a company vehicle" />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-4xl space-y-6">
        {/* Vehicle info */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Vehicle Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Vehicle Number *" value={form.vehicle_number} onChange={(v) => update('vehicle_number', v)} required placeholder="DXB-12345" />
            <Input label="Registration Number" value={form.registration_number} onChange={(v) => update('registration_number', v)} />
            <Input label="Make" value={form.make} onChange={(v) => update('make', v)} placeholder="Toyota" />
            <Input label="Model" value={form.model} onChange={(v) => update('model', v)} placeholder="Hiace" />
            <Input label="Year" type="number" value={form.year} onChange={(v) => update('year', v)} placeholder="2023" />
            <Input label="Mileage (km)" type="number" value={form.mileage} onChange={(v) => update('mileage', v)} />
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Type</label>
              <select
                value={form.fuel_type}
                onChange={(e) => update('fuel_type', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 capitalize"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 capitalize"
              >
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expiry dates */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Important Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Insurance Expiry" type="date" value={form.insurance_expiry} onChange={(v) => update('insurance_expiry', v)} />
            <Input label="Registration Expiry" type="date" value={form.registration_expiry} onChange={(v) => update('registration_expiry', v)} />
            <Input label="Service Due Date" type="date" value={form.service_due_date} onChange={(v) => update('service_due_date', v)} />
          </div>
        </div>

        {/* Assignment */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Current Location" value={form.current_location} onChange={(v) => update('current_location', v)} placeholder="e.g., Dubai HQ" />
            <Input label="Department" value={form.department} onChange={(v) => update('department', v)} placeholder="e.g., Logistics" />
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Notes</h2>
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
            {loading ? 'Saving...' : 'Save Vehicle'}
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