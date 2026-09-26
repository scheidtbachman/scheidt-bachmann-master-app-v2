'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import { Send, Loader2 } from 'lucide-react'

type Message = {
  id: number
  sender_id: string | null
  room_id: string
  content: string
  created_at: string
  sender_name?: string | null
}

const ROOMS = [
  { id: 'general',        label: 'General' },
  { id: 'management',     label: 'Management' },
  { id: 'logistics-team', label: 'Logistics Team' },
  { id: 'technical-team', label: 'Technical Team' },
  { id: 'amc-team',       label: 'AMC Team' },
  { id: 'project-team',   label: 'Project Team' },
]

export default function ChatPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [roomId, setRoomId] = useState('general')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load user + initial messages + subscribe to new ones
  useEffect(() => {
    let mounted = true

    async function init() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) {
          setError('You must be logged in')
          setLoading(false)
        }
        return
      }

      if (mounted) setUserId(user.id)

      // 2. Get user's profile name
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (mounted && prof) setUserName(prof.full_name || '')

      // 3. Load messages for the room
      await loadMessages(roomId)
    }

    async function loadMessages(room: string) {
      if (!mounted) return
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room)
        .order('created_at', { ascending: true })
        .limit(200)

      if (error) {
        if (mounted) {
          setError('Failed to load messages: ' + error.message)
          setLoading(false)
        }
        return
      }

      // Fetch sender names separately
      const enriched = await enrichWithNames(data || [])
      if (mounted) {
        setMessages(enriched)
        setLoading(false)
      }
    }

    async function enrichWithNames(rows: any[]): Promise<Message[]> {
      const senderIds = Array.from(new Set(rows.map((r) => r.sender_id).filter(Boolean)))
      if (!senderIds.length) return rows

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds)

      const nameMap: Record<string, string> = {}
      profiles?.forEach((p) => { nameMap[p.id] = p.full_name || 'Unknown' })

      return rows.map((r) => ({ ...r, sender_name: nameMap[r.sender_id] || null }))
    }

    init()

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const newMsg = payload.new as Message

          // Get sender name
          if (newMsg.sender_id) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .single()
            newMsg.sender_name = prof?.full_name || null
          }

          if (mounted) {
            setMessages((m) => {
              // Prevent duplicate
              if (m.some((x) => x.id === newMsg.id)) return m
              return [...m, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!text.trim()) return
    if (!userId) {
      setError('You are not logged in. Refresh the page.')
      return
    }

    setSending(true)
    const t = text.trim()
    setText('')

    const { error: insertErr } = await supabase
      .from('chat_messages')
      .insert({
        company_id: '00000000-0000-0000-0000-000000000001',
        sender_id: userId,
        room_id: roomId,
        content: t,
      })

    setSending(false)

    if (insertErr) {
      setError('Failed to send: ' + insertErr.message)
      setText(t) // restore the text so user doesn't lose it
    }
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

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs px-4 py-2">
            ⚠️ {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="text-center text-slate-400 text-sm py-8 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading messages...
            </div>
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
                        {m.sender_name || 'Team member'}
                      </div>
                    )}
                    <div className="text-sm break-words whitespace-pre-wrap">{m.content}</div>
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
            placeholder={`Message ${ROOMS.find((r) => r.id === roomId)?.label}...`}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending || !userId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg disabled:opacity-40 flex items-center gap-1"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}