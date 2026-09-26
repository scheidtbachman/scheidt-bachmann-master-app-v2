import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { email, password, full_name, employee_id, department, designation, mobile, role } = body

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, password, full name required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { full_name, role: role || 'employee' },
  })

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message || 'Failed' }, { status: 400 })
  }

  await admin.from('profiles').update({
    full_name,
    employee_id: employee_id || null,
    department: department || null,
    designation: designation || null,
    mobile: mobile || null,
    role: role || 'employee',
  }).eq('id', created.user.id)

  return NextResponse.json({ success: true, user: { id: created.user.id } })
}