'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle2, Truck, Play, AlertOctagon, CheckCheck, X,
  Loader2, Wrench,
} from 'lucide-react'

type Status =
  | 'open'
  | 'accepted'
  | 'traveling'
  | 'in_progress'
  | 'waiting_parts'
  | 'resolved'
  | 'closed'
  | 'cancelled'

export default function TicketActions({
  ticketId,
  status,
  ticketNumber,
}: {
  ticketId: string
  status: Status
  ticketNumber: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)

  const [workDone, setWorkDone] = useState('')
  const [partsUsed, setPartsUsed] = useState('')

  const [signatureName, setSignatureName] = useState('')
  const [signatureNotes, setSignatureNotes] = useState('')

  async function updateStatus(newStatus: Status, extra: Record<string, any> = {}) {
    setBusy(true)
    setError('')

    const patch: Record<string, any> = {
      status: newStatus,
      ...extra,
    }
    if (newStatus === 'resolved') patch.resolved_at = new Date().toISOString()

    const { error } = await supabase
      .from('technical_tickets')
      .update(patch)
      .eq('id', ticketId)

    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }

    setShowResolveForm(false)
    setShowCloseForm(false)
    router.refresh()
  }

  // ────────── CLOSED / CANCELLED ──────────
  if (status === 'closed' || status === 'cancelled') {
    return (
      <div className={`border rounded-lg p-5 ${status === 'closed' ? 'bg-green-50 border-green-200' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className={status === 'closed' ? 'text-green-600' : 'text-slate-500'} size={20} />
          <div>
            <div className={`font-medium text-sm ${status === 'closed' ? 'text-green-900' : 'text-slate-700'}`}>
              Ticket {status === 'closed' ? 'Closed' : 'Cancelled'}
            </div>
            <div className={`text-xs ${status === 'closed' ? 'text-green-700' : 'text-slate-500'}`}>
              No further actions required.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Wrench size={18} /> Actions
      </h2>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>
      )}

      {/* ─────── open ─────── */}
      {status === 'open' && (
        <div className="space-y-2">
          <ActionButton
            onClick={() => updateStatus('accepted')}
            busy={busy}
            icon={<CheckCircle2 size={16} />}
            label="Accept Ticket"
            description="Confirm you'll handle this ticket"
            color="blue"
          />
          <ActionButton
            onClick={() => updateStatus('cancelled')}
            busy={busy}
            icon={<X size={16} />}
            label="Cancel Ticket"
            description="Mark as invalid or duplicate"
            color="slate"
          />
        </div>
      )}

      {/* ─────── accepted ─────── */}
      {status === 'accepted' && (
        <div className="space-y-2">
          <ActionButton
            onClick={() => updateStatus('traveling')}
            busy={busy}
            icon={<Truck size={16} />}
            label="Start Traveling"
            description="You're on your way to the site"
            color="orange"
          />
        </div>
      )}

      {/* ─────── traveling ─────── */}
      {status === 'traveling' && (
        <div className="space-y-2">
          <ActionButton
            onClick={() => updateStatus('in_progress')}
            busy={busy}
            icon={<Play size={16} />}
            label="Arrived — Start Work"
            description="Begin diagnosing and fixing the issue"
            color="purple"
          />
        </div>
      )}

      {/* ─────── in_progress ─────── */}
      {status === 'in_progress' && !showResolveForm && (
        <div className="space-y-2">
          <ActionButton
            onClick={() => setShowResolveForm(true)}
            busy={busy}
            icon={<CheckCheck size={16} />}
            label="Mark as Resolved"
            description="Fix is complete — add work details"
            color="green"
          />
          <ActionButton
            onClick={() => updateStatus('waiting_parts')}
            busy={busy}
            icon={<AlertOctagon size={16} />}
            label="Waiting for Parts"
            description="Need spare parts from warehouse"
            color="orange"
          />
        </div>
      )}

      {/* ─────── waiting_parts ─────── */}
      {status === 'waiting_parts' && (
        <div className="space-y-2">
          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
            Waiting for parts. Resume when parts arrive.
          </div>
          <ActionButton
            onClick={() => updateStatus('in_progress')}
            busy={busy}
            icon={<Play size={16} />}
            label="Resume Work"
            description="Parts received — continue the fix"
            color="purple"
          />
        </div>
      )}

      {/* ─────── Resolve form ─────── */}
      {showResolveForm && (
        <div className="border border-green-200 bg-green-50/50 rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-green-900">Work Details</div>

          <div>
            <label className="block text-xs font-medium mb-1">What was done? *</label>
            <textarea
              rows={3}
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              placeholder="e.g., Replaced barrier motor, tested opening/closing cycles..."
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Parts used (optional)</label>
            <input
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
              placeholder="e.g., Barrier Motor BM-101 (1), Cable 5m"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() =>
                updateStatus('resolved', {
                  work_done: workDone || null,
                  parts_used: partsUsed || null,
                })
              }
              disabled={busy || !workDone.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              Confirm Resolved
            </button>
            <button
              onClick={() => setShowResolveForm(false)}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─────── resolved ─────── */}
      {status === 'resolved' && !showCloseForm && (
        <div className="space-y-2">
          <div className="text-xs text-green-700 bg-green-50 p-2 rounded flex items-center gap-1.5">
            <CheckCircle2 size={12} /> Work complete — awaiting customer confirmation
          </div>
          <ActionButton
            onClick={() => setShowCloseForm(true)}
            busy={busy}
            icon={<CheckCheck size={16} />}
            label="Close Ticket"
            description="Customer confirmed — collect signature"
            color="blue"
          />
        </div>
      )}

      {/* ─────── Close form ─────── */}
      {showCloseForm && (
        <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-blue-900">Customer Confirmation</div>

          <div>
            <label className="block text-xs font-medium mb-1">Customer name *</label>
            <input
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g., Mr. Ahmed (Site Manager)"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Comments (optional)</label>
            <input
              value={signatureNotes}
              onChange={(e) => setSignatureNotes(e.target.value)}
              placeholder="e.g., Works perfectly, thanks"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>

          <div className="text-[11px] text-slate-500">
            By closing, you confirm the customer accepted the work.
            Digital signature pad coming soon.
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() =>
                updateStatus('closed', {
                  customer_signature: signatureName
                    ? `${signatureName}${signatureNotes ? ' — ' + signatureNotes : ''}`
                    : null,
                })
              }
              disabled={busy || !signatureName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              Close Ticket
            </button>
            <button
              onClick={() => setShowCloseForm(false)}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  onClick, busy, icon, label, description, color,
}: {
  onClick: () => void
  busy: boolean
  icon: React.ReactNode
  label: string
  description: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'slate'
}) {
  const colorMap = {
    blue:   'border-blue-200 hover:bg-blue-50 text-blue-700',
    green:  'border-green-200 hover:bg-green-50 text-green-700',
    orange: 'border-orange-200 hover:bg-orange-50 text-orange-700',
    purple: 'border-purple-200 hover:bg-purple-50 text-purple-700',
    slate:  'border-slate-200 hover:bg-slate-50 text-slate-700',
  }
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`w-full text-left border rounded-lg p-3 transition disabled:opacity-50 flex items-start gap-3 ${colorMap[color]}`}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
    </button>
  )
}