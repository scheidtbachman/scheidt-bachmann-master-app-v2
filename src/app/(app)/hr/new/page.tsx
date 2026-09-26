'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'

export default function NewEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', employee_id: '',
    department: '', designation: '', mobile: '', role: 'employee',
  })

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const res = await fetch('/api/admin/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
    router.push('/hr'); router.refresh()
  }

  return (
    <div>
      <PageHeader title="Add Employee" subtitle="Create a new employee account" />
      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 max-w-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name *"   value={form.full_name}   onChange={(v) => update('full_name', v)}   required />
          <Input label="Employee ID"   value={form.employee_id} onChange={(v) => update('employee_id', v)} />
          <Input label="Email *"       type="email"    value={form.email}    onChange={(v) => update('email', v)}    required />
          <Input label="Password *"    type="password" value={form.password} onChange={(v) => update('password', v)} required />
          <Input label="Mobile"        value={form.mobile}      onChange={(v) => update('mobile', v)} />
          <Input label="Department"    value={form.department}  onChange={(v) => update('department', v)} />
          <Input label="Designation"   value={form.designation} onChange={(v) => update('designation', v)} />
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)} className="w-full border rounded-lg px-3 py-2">
              {['employee','manager','technician','driver','warehouse','admin','owner'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
    </div>
  )
}