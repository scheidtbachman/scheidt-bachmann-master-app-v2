'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, MapPin, Package, Truck, Wrench, Users,
  Car, Warehouse, FileText, MessageSquare, BarChart3,
  Settings, Calendar, ClipboardList, Building2, ShoppingCart,
  LogOut, ShieldAlert, X,
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

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white flex flex-col z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header with close button on mobile */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="font-bold text-lg leading-tight">MASTER APP</h1>
          <p className="text-xs text-slate-400 mt-1 truncate">
            Scheidt and Bachmann Middle East
          </p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 -mr-1 text-slate-400 hover:text-white"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-800 transition ${
                active ? 'bg-blue-600 hover:bg-blue-600' : ''
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer with logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white w-full"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  )
}