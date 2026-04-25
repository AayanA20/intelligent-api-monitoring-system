import { useState, useMemo } from 'react'
import { ShieldAlert, Ban, AlertTriangle, Clock, RefreshCcw } from 'lucide-react'
import ChartCard from '../components/ChartCard'
import LiveIndicator from '../components/LiveIndicator'
import DecisionBadge from '../components/DecisionBadge'
import { usePolling } from '../hooks/usePolling'
import * as API from '../lib/api'
import { useAuth } from '../context/AuthContext'

const FILTERS = [
  { key: 'ALL', label: 'All', icon: ShieldAlert, color: 'text-slate-300' },
  { key: 'BLOCK', label: 'Blocked', icon: Ban, color: 'text-danger' },
  { key: 'WARN', label: 'Warnings', icon: AlertTriangle, color: 'text-warn' },
  { key: 'SLOW', label: 'Slowed', icon: Clock, color: 'text-info' },
]

export default function AbuseTimeline() {
  const { user } = useAuth()   // ✅ INSIDE COMPONENT

  const [filter, setFilter] = useState('ALL')
  const { data, refresh } = usePolling(() => API.getAbuseEvents(100), 3000)

  const counts = useMemo(() => {
    const c = { BLOCK: 0, WARN: 0, SLOW: 0 }
    ;(data || []).forEach(e => {
      if (c[e.decision] != null) c[e.decision]++
    })
    return c
  }, [data])

  // ✅ FIXED FILTER (USER-SPECIFIC)
  const filtered = useMemo(() => {
    if (!data || !user) return []

    const userFiltered = data.filter(e => e.userName === user.username)

    return filter === 'ALL'
      ? userFiltered
      : userFiltered.filter(e => e.decision === filter)
  }, [data, filter, user])

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abuse Timeline</h1>
          <p className="text-slate-400 mt-1">
            Your flagged requests and behavior
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <button onClick={refresh} className="btn-secondary">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryTile icon={Ban} label="Blocked" value={counts.BLOCK} color="danger" />
        <SummaryTile icon={AlertTriangle} label="Warnings" value={counts.WARN} color="warn" />
        <SummaryTile icon={Clock} label="Slowed" value={counts.SLOW} color="info" />
      </div>

      <ChartCard title="Your Events" subtitle={`${filtered.length} events`}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No events yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  )
}

function SummaryTile({ icon: Icon, label, value, color }) {
  const styles = {
    danger: 'border-danger/30 bg-danger/5 text-danger',
    warn: 'border-warn/30 bg-warn/5 text-warn',
    info: 'border-info/30 bg-info/5 text-info',
  }[color]

  return (
    <div className={`card border ${styles}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold opacity-80">
            {label}
          </p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-10 h-10 opacity-40" />
      </div>
    </div>
  )
}

function EventRow({ event }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-bg-soft border border-slate-800/60">
      <DecisionBadge value={event.decision} />
      <div className="flex-1">
        <p className="text-sm text-slate-200">{event.endpoint}</p>
        <p className="text-xs text-slate-500">{event.reason}</p>
      </div>
    </div>
  )
}