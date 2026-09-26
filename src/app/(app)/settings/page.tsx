import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import { Building2, Mail, Phone, MapPin, Shield, User } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: company } = await supabase.from('companies').select('*').limit(1).single()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company and account configuration" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company */}
        <div className="bg-white border rounded-lg p-5 md:p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 size={18} /> Company Information
          </h2>
          <div className="space-y-3 text-sm">
            <Row icon={Building2} label="Name" value={company?.name || '—'} />
            <Row icon={MapPin} label="Address" value={company?.address || '—'} />
            <Row icon={Phone} label="Phone" value={company?.phone || '—'} />
            <Row icon={Mail} label="Email" value={company?.email || '—'} />
          </div>
          <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            💡 Company information is currently managed via the database. Editing UI coming soon.
          </div>
        </div>

        {/* Your account */}
        <div className="bg-white border rounded-lg p-5 md:p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User size={18} /> Your Account
          </h2>
          <div className="space-y-3 text-sm">
            <Row icon={User} label="Name" value={profile?.full_name || '—'} />
            <Row icon={Mail} label="Email" value={user?.email || '—'} />
            <Row icon={Shield} label="Role" value={profile?.role || 'employee'} />
            <Row icon={Building2} label="Department" value={profile?.department || '—'} />
          </div>
          <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            💡 To change your password, use the Supabase Auth panel or contact an administrator.
          </div>
        </div>

        {/* System */}
        <div className="bg-white border rounded-lg p-5 md:p-6 lg:col-span-2">
          <h2 className="font-semibold mb-4">System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="border rounded-lg p-4">
              <div className="text-slate-500 text-xs">Application</div>
              <div className="font-medium mt-1">Master App v2.0</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-slate-500 text-xs">Database</div>
              <div className="font-medium mt-1">Supabase (PostgreSQL)</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-slate-500 text-xs">Hosting</div>
              <div className="font-medium mt-1">Vercel</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-slate-500 text-xs">Version</div>
              <div className="font-medium mt-1">Next.js 14.2.35</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  icon: Icon, label, value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0 border-slate-100">
      <Icon size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-slate-900 font-medium truncate">{value}</div>
      </div>
    </div>
  )
}