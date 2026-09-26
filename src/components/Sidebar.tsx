'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, MapPin, Package, Truck, Wrench, Users,
  Car, Warehouse, FileText, MessageSquare, BarChart3,
  Settings, Calendar, ClipboardList, Building2, ShoppingCart,
  Bell, LogOut, ShieldAlert
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/sites',      label: 'Parking Sites',    icon: MapPin },
  { href: '/assets',     label: 'Assets',           icon: Package },
  { href: '/warehouse',  label: 'Warehouse',        icon: Warehouse },
  { href: '/logistics',  label: 'Logistics',        icon: Truck },
  { href: '/deliveries', label: 'Deliveries',       icon: Truck },
  { href: '/vehicles',   label: 'Vehicles',         icon: Car },
  { href: '/technical',  label: 'Technical',        icon: Wrench },
  { href: '/amc',        label: 'AMC Contracts',    icon: FileText },
  { href: '/projects',   label: 'Projects',         icon: Building2 },
  { href: '/tasks',      label: 'Tasks',            icon: ClipboardList },
  { href: '/calendar',   label: 'Calendar',         icon: Calendar },
  { href: '/customers',  label: 'Customers',        icon: Users },
  { href: '/sales',      label: 'Sales',            icon: ShoppingCart },
  { href: '/hr',         label: 'HR / Employees',   icon: Users },
  { href: '/incidents',  label: 'Incidents',        icon: ShieldAlert },
  { href: '/chat',       label: 'Company Chat',     icon: MessageSquare },
  { href: '/reports',    label: 'Reports',          icon: BarChart3 },
  { href: '/audit',      label: 'Audit Log',        icon: FileText },
  { href: '/settings',   label: 'Settings',         icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="font-bold text-lg leading-tight">MASTER APP</h1>
        <p className="text-xs text-slate-400 mt-1">
          Scheidt and Bachmann Middle East
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-800 transition ${
                active ? 'bg-blue-600 hover:bg-blue-600' : ''
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  )
}