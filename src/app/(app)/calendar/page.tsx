import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Calendar as CalendarIcon, Truck, Wrench, FileText, ClipboardList, Building2 } from 'lucide-react'

type Event = {
  date: string
  title: string
  type: 'delivery' | 'amc' | 'task' | 'project' | 'ticket'
  href: string
}

export default async function CalendarPage() {
  const supabase = await createClient()

  const [deliveries, amc, tasks, projects, tickets] = await Promise.all([
    supabase.from('deliveries').select('id, delivery_id, customer_name, scheduled_at').not('scheduled_at', 'is', null).limit(50),
    supabase.from('amc_contracts').select('id, contract_number, customer_name, end_date').not('end_date', 'is', null).limit(50),
    supabase.from('tasks').select('id, title, due_date').not('due_date', 'is', null).limit(50),
    supabase.from('projects').select('id, name, target_completion').not('target_completion', 'is', null).limit(50),
    supabase.from('technical_tickets').select('id, ticket_number, title, created_at').limit(50),
  ])

  const events: Event[] = []

  deliveries.data?.forEach((d) => {
    if (d.scheduled_at) {
      events.push({
        date: d.scheduled_at,
        title: `Delivery ${d.delivery_id} — ${d.customer_name || ''}`,
        type: 'delivery',
        href: `/deliveries/${d.id}`,
      })
    }
  })

  amc.data?.forEach((c) => {
    if (c.end_date) {
      events.push({
        date: c.end_date,
        title: `AMC expires: ${c.contract_number} — ${c.customer_name}`,
        type: 'amc',
        href: `/amc/${c.id}`,
      })
    }
  })

  tasks.data?.forEach((t) => {
    if (t.due_date) {
      events.push({
        date: t.due_date,
        title: `Task due: ${t.title}`,
        type: 'task',
        href: `/tasks`,
      })
    }
  })

  projects.data?.forEach((p) => {
    if (p.target_completion) {
      events.push({
        date: p.target_completion,
        title: `Project target: ${p.name}`,
        type: 'project',
        href: `/projects/${p.id}`,
      })
    }
  })

  tickets.data?.forEach((t) => {
    events.push({
      date: t.created_at,
      title: `Ticket: ${t.ticket_number} — ${t.title}`,
      type: 'ticket',
      href: `/technical/${t.id}`,
    })
  })

  // Sort and split into upcoming and past
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now)
  const past = events.filter((e) => new Date(e.date).getTime() < now).reverse().slice(0, 20)

  const typeIcon = {
    delivery: { Icon: Truck,          color: 'text-orange-600', bg: 'bg-orange-50' },
    amc:      { Icon: FileText,       color: 'text-blue-600',   bg: 'bg-blue-50' },
    task:     { Icon: ClipboardList,  color: 'text-purple-600', bg: 'bg-purple-50' },
    project:  { Icon: Building2,      color: 'text-green-600',  bg: 'bg-green-50' },
    ticket:   { Icon: Wrench,         color: 'text-red-600',    bg: 'bg-red-50' },
  }

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Company-wide events, deadlines & reminders" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-600" />
            <h2 className="font-semibold">Upcoming ({upcoming.length})</h2>
          </div>
          <div className="p-4">
            {upcoming.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">No upcoming events</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {upcoming.map((e, i) => {
                  const { Icon, color, bg } = typeIcon[e.type]
                  const date = new Date(e.date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  return (
                    <Link
                      key={i}
                      href={e.href}
                      className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition ${
                        isToday ? 'border-blue-300 bg-blue-50/50' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${bg}`}>
                        <Icon size={16} className={color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm line-clamp-2">{e.title}</div>
                        <div className={`text-xs mt-1 ${isToday ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                          {isToday ? 'Today · ' : ''}
                          {date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Past */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b flex items-center gap-2">
            <CalendarIcon size={18} className="text-slate-500" />
            <h2 className="font-semibold">Recent Past ({past.length})</h2>
          </div>
          <div className="p-4">
            {past.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">No past events</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {past.map((e, i) => {
                  const { Icon, color, bg } = typeIcon[e.type]
                  const date = new Date(e.date)
                  return (
                    <Link
                      key={i}
                      href={e.href}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition opacity-70"
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${bg}`}>
                        <Icon size={16} className={color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm line-clamp-2">{e.title}</div>
                        <div className="text-xs mt-1 text-slate-500">
                          {date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}