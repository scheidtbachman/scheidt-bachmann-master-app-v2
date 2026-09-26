'use client'

import { Search, Bell, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.email ?? 'User')
    })
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
      setMobileSearchOpen(false)
    }
  }

  return (
    <header
      className="bg-white border-b sticky top-0 z-20"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6 gap-2 md:gap-4">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 rounded-lg lg:hidden flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={22} className="text-slate-700" />
        </button>

        {/* Desktop search — hidden below md */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Global search: PC-1045, Delivery, Site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Mobile search icon — visible only on mobile */}
        <button
          onClick={() => setMobileSearchOpen((v) => !v)}
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"
          aria-label="Search"
        >
          <Search size={20} className="text-slate-700" />
        </button>

        {/* Right-side controls */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto flex-shrink-0">
          <button className="relative p-2 hover:bg-slate-100 rounded-lg" aria-label="Notifications">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User info — hidden on very small screens, shown on sm+ */}
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium truncate max-w-[140px] md:max-w-[200px]">
              {userName}
            </div>
            <div className="text-xs text-slate-500">Online</div>
          </div>

          {/* Avatar — only visible on very small screens */}
          <div className="sm:hidden w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Mobile search bar — expands below topbar when tapped */}
      {mobileSearchOpen && (
        <form onSubmit={handleSearch} className="md:hidden border-t px-3 py-2 bg-slate-50">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      )}
    </header>
  )
}