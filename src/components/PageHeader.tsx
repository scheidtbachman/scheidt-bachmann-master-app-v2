'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 md:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2">{subtitle}</p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto flex-shrink-0"
        >
          <Plus size={16} /> {actionLabel}
        </Link>
      )}
    </div>
  )
}