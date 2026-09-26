import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

export default function StatCard({
  label, value, icon: Icon, color = 'blue', href,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate'
  href?: string
}) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    slate:  'bg-slate-100 text-slate-600',
  }

    const content = (
    <div className="bg-white border rounded-lg p-3 md:p-4 hover:shadow-md transition cursor-pointer h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide truncate">
            {label}
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-900 mt-1 md:mt-2">{value}</div>
        </div>
        <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${colors[color]}`}>
          <Icon size={18} className="md:hidden" />
          <span className="hidden md:inline"><Icon size={22} /></span>
        </div>
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}