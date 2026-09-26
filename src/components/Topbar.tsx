'use client'

import { Search, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Topbar() {
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.email ?? 'User')
    })
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchTerm.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`
    }
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Global search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      <div className="flex items-center gap-4 ml-6">
        <button className="relative p-2 hover:bg-slate-100 rounded-lg">
          <Bell size={20} className="text-slate-600" />
        </button>
        <div className="text-sm">
          <div className="font-medium truncate max-w-[180px]">{userName}</div>
          <div className="text-xs text-slate-500">Online</div>
        </div>
      </div>
    </header>
  )
}