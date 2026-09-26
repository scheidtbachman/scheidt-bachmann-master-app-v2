'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  title: string
  message: string | null
  category: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

// This is what shows when there are no notifications in the DB.
// It surfaces REAL operational alerts computed from your data.
type DerivedAlert = {
  id: string
  title: string
  message: string
  link: string
  severity: 'info' | 'warning' | 'danger'
}

export default function NotificationsBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [stored, setStored] = useState<Notification[]>([])
  const [alerts, setAlerts] = useState<DerivedAlert[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Load on mount
  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Stored notifications (from `notifications` table)
    if (user) {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setStored(notifs || [])
    }

    // 2. Derived alerts from live data
    const now = new Date()
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const today = now.toISOString().slice(0, 10)
    const derived: DerivedAlert[] = []

    // AMC expiring soon
    const { data: amcExpiring } = await supabase
      .from('amc_contracts')
      .select('id, contract_number, customer_name, end_date')
      .eq('status', 'active')
      .lte('end_date', in30Days)
      .gte('end_date', today)
      .limit(5)
    amcExpiring?.forEach((a) => derived.push({
      id: `amc-${a.id}`,
      title: 'AMC expiring soon',
      message: `${a.contract_number} (${a.customer_name}) ends ${a.end_date}`,
      link: `/amc/${a.id}`,
      severity: 'warning',
    }))

    // Low stock
    const { data: lowStock } = await supabase
      .from('warehouse_items')
      .select('id, description, quantity, min_stock')
      .limit(100)
    const low = lowStock?.filter((i) => i.quantity <= i.min_stock).slice(0, 5) || []
    low.forEach((i) => derived.push({
      id: `stock-${i.id}`,
      title: 'Low warehouse stock',
      message: `${i.description} — only ${i.quantity} left (min ${i.min_stock})`,
      link: '/warehouse?low=1',
      severity: 'warning',
    }))

    // Overdue tasks
    const { data: overdue } = await supabase
      .from('tasks')
      .select('id, title, due_date, status')
      .lt('due_date', now.toISOString())
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .limit(5)
    overdue?.forEach((t) => derived.push({
      id: `task-${t.id}`,
      title: 'Overdue task',
      message: `${t.title} — due ${new Date(t.due_date).toLocaleDateString()}`,
      link: '/tasks',
      severity: 'danger',
    }))

    // Vehicle expiries
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, vehicle_number, insurance_expiry, registration_expiry')
      .limit(100)
    vehicles?.forEach((v) => {
      if (v.insurance_expiry && v.insurance_expiry <= in30Days && v.insurance_expiry >= today) {
        derived.push({
          id: `veh-ins-${v.id}`,
          title: 'Vehicle insurance expiring',
          message: `${v.vehicle_number} — expires ${v.insurance_expiry}`,
          link: `/vehicles/${v.id}`,
          severity: 'warning',
        })
      }
      if (v.registration_expiry && v.registration_expiry <= in30Days && v.registration_expiry >= today) {
        derived.push({
          id: `veh-reg-${v.id}`,
          title: 'Vehicle registration expiring',
          message: `${v.vehicle_number} — expires ${v.registration_expiry}`,
          link: `/vehicles/${v.id}`,
          severity: 'warning',
        })
      }
    })

    setAlerts(derived)
    setLoading(false)
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setStored((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAllRead() {
    const unread = stored.filter((n) => !n.is_read).map((n) => n.id)
    if (!unread.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unread)
    setStored((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadStored = stored.filter((n) => !n.is_read).length
  const totalBadge = unreadStored + alerts.length

  const severityColor = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    danger: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 hover:bg-slate-100 rounded-lg"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-slate-700" />
        {totalBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b flex items-center justify-between bg-slate-50">
            <div className="font-semibold text-sm">
              Notifications {totalBadge > 0 && <span className="text-slate-500">({totalBadge})</span>}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-slate-200 rounded"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
            ) : totalBadge === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <div className="text-3xl mb-2">🎉</div>
                All caught up!
              </div>
            ) : (
              <>
                {/* Live alerts */}
                {alerts.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b">
                      Live Alerts ({alerts.length})
                    </div>
                    {alerts.map((a) => (
                      <Link
                        key={a.id}
                        href={a.link}
                        onClick={() => setOpen(false)}
                        className={`block p-3 border-b last:border-0 hover:bg-slate-50 transition`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                            a.severity === 'danger' ? 'bg-red-500' :
                            a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{a.title}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{a.message}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Stored notifications */}
                {stored.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b flex items-center justify-between">
                      <span>Inbox ({stored.length})</span>
                      {unreadStored > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-blue-600 hover:underline font-normal text-[10px] normal-case"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {stored.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 border-b last:border-0 ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium flex items-center gap-2">
                              {!n.is_read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                              {n.title}
                            </div>
                            {n.message && (
                              <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </div>
                          </div>
                          {!n.is_read && (
                            <button
                              onClick={() => markRead(n.id)}
                              className="text-[10px] text-blue-600 hover:underline flex-shrink-0"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setOpen(false)}
                            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                          >
                            Open →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-2 border-t bg-slate-50 text-center">
            <button
              onClick={loadAll}
              className="text-xs text-blue-600 hover:underline"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}