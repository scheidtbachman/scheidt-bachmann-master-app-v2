'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import { Send } from 'lucide-react'

type Message = {
  id: number
  sender_id: string
  room_id: string
  content: string
  created_at: string
  profiles?: { full_name: string | null } | null
}

const ROOMS = [
  { id: 'general',         label: 'General' },
  { id: 'management',      label: 'Management' },
  { id: 'logistics-team',  label: 'Logistics Team' },
  { id: 'technical-team',  label: 'Technical Team' },
  { id: 'amc-team',        label: 'AMC Team' },
  { id: 'project-team',    label: 'Project Team' },
]

export default function ChatPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState('')
  const [roomId, setRoomId] = useState('general')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Initial load
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ''))

    // Load messages
    loadMessages(roomId)

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*, profiles!chat_messages_sender_id_fkey(full_name)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages((m) => [...m, data as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  async function loadMessages(room: string) {
    setLoading(true)
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles!chat_messages_sender_id_fkey(full_name)')
      .eq('room_id', room)
      .order('created_at', { ascending: true })
      .limit(200)
    setMessages((data as Message[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId) return
    const t = text.trim()
    setText('')
    await supabase.from('chat_messages').insert({
      company_id: '00000000-0000-0000-0000-000000000001',
      sender_id: userId,
      room_id: roomId,
      content: t,
    })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <PageHeader title="Company Chat" subtitle="Internal messaging across departments" />

      <div className="flex-1 bg-white border rounded-lg flex flex-col overflow-hidden">
        {/* Room tabs */}
        <div className="border-b flex overflow-x-auto">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoomId(r.id)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition ${
                roomId === r.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="text-center text-slate-400 text-sm py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              No messages in {ROOMS.find((r) => r.id === roomId)?.label}. Say hello 👋
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === userId
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      mine ? 'bg-blue-600 text-white' : 'bg-white border text-slate-900'
                    }`}
                  >
                    {!mine && (
                      <div className="text-xs font-medium mb-1 text-slate-500">
                        {m.profiles?.full_name || 'Unknown'}
                      </div>
                    )}
                    <div className="text-sm break-words">{m.content}</div>
                    <div className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}