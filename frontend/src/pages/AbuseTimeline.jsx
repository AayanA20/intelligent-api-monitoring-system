import { useState, useMemo } from 'react'
import { ShieldAlert, Ban, AlertTriangle, Clock, RefreshCcw } from 'lucide-react'
import ChartCard from '../components/ChartCard'
import LiveIndicator from '../components/LiveIndicator'
import DecisionBadge from '../components/DecisionBadge'
import { usePolling } from '../hooks/usePolling'
import * as API from '../lib/api'
import { useAuth } from '../context/AuthContext'

const FILTERS = [
  { key: 'ALL',   label: 'All',      icon: ShieldAlert,    color: 'text-text-primary' },
  { key: 'BLOCK', label: 'Blocked',  icon: Ban,            color: 'text-danger' },
  { key: 'WARN',  label: 'Warnings', icon: AlertTriangle,  color: 'text-warn' },
  { key: 'SLOW',  label: 'Slowed',   icon: Clock,          color: 'text-info' },
]

export default function AbuseTimeline() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('ALL')
  const { data, refresh } = usePolling(() => API.getAbuseEvents(500), 3000)

  const myEvents = useMemo(() => {
    if (!data || !user) return []
    return data.filter(e => e.userName === user.username)
  }, [data, user])

  const counts = useMemo(() => {
    const c = { BLOCK: 0, WARN: 0, SLOW: 0 }
    myEvents.forEach(e => {
      if (c[e.decision] != null) c[e.decision]++
    })
    return c
  }, [myEvents])

  const filtered = useMemo(() => {
    return filter === 'ALL' ? myEvents : myEvents.filter(e => e.decision === filter)
  }, [myEvents, filter])

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Abuse Timeline</h1>
          <p className="text-text-secondary mt-1">Your flagged requests and behavior</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <button onClick={refresh} className="btn-secondary">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryTile icon={Ban}           label="Blocked"  value={counts.BLOCK} color="danger" />
        <SummaryTile icon={AlertTriangle} label="Warnings" value={counts.WARN}  color="warn"   />
        <SummaryTile icon={Clock}         label="Slowed"   value={counts.SLOW}  color="info"   />
      </div>

      <ChartCard title="Your Events" subtitle={`${filtered.length} of ${myEvents.length} events`}>
        <div className="flex gap-1 p-1 bg-bg-soft border border-bg-border rounded-lg mb-5 inline-flex">
          {FILTERS.map(f => {
            const Icon = f.icon
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-all
                  ${filter === f.key
                    ? 'bg-brand text-white'
                    : `${f.color} hover:bg-bg-hover`}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No events yet — try the Attack Simulator</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(event => <EventRow key={event.id} event={event} />)}
          </div>
        )}
      </ChartCard>
    </div>
  )
}

function SummaryTile({ icon: Icon, label, value, color }) {
  const styles = {
    danger: 'border-danger/30 bg-danger-light/40 text-danger',
    warn:   'border-warn/30   bg-warn-light/40   text-warn',
    info:   'border-info/30   bg-info-light/40   text-info',
  }[color]
  return (
    <div className={`card border ${styles}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-10 h-10 opacity-40" />
      </div>
    </div>
  )
}

function EventRow({ event }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-bg-soft border border-bg-border animate-slide-up">
      <DecisionBadge value={event.decision} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm mono text-text-primary">{event.endpoint}</span>
          <span className="text-xs text-text-muted mono">{event.ipAddress}</span>
        </div>
        <p className="text-xs text-text-secondary mt-1">{event.reason}</p>
      </div>
      <span className="text-xs text-text-muted mono whitespace-nowrap">{formatTime(event.createdAt || event.timestamp)}</span>
    </div>
  )
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return String(ts).slice(11, 19)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return String(ts) }
}