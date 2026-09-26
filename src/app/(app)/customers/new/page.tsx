'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'

export default function NewCustomerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_code: `CUS-${Date.now().toString().slice(-5)}`,
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  })

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('customers')
      .insert({
        ...form,
        company_id: '00000000-0000-0000-0000-000000000001',
        status: 'active',
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/customers')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="Add Customer" subtitle={`Code: ${form.customer_code}`} />

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 md:p-6 max-w-3xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Customer Code" value={form.customer_code} onChange={(v) => update('customer_code', v)} />
          <Input label="Company Name *" value={form.company_name} onChange={(v) => update('company_name', v)} required />
          <Input label="Contact Person" value={form.contact_person} onChange={(v) => update('contact_person', v)} />
          <Input label="Phone" value={form.phone} onChange={(v) => update('phone', v)} />
          <Input label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} />
          <Input label="Address" value={form.address} onChange={(v) => update('address', v)} />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Customer'}
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

function Input({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
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