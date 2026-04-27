import { useState, useMemo } from 'react'
import { Search, RefreshCcw, Filter } from 'lucide-react'
import ChartCard from '../components/ChartCard'
import LiveIndicator from '../components/LiveIndicator'
import DecisionBadge from '../components/DecisionBadge'
import StatusBadge from '../components/StatusBadge'
import { usePolling } from '../hooks/usePolling'
import * as API from '../lib/api'

const DECISION_FILTERS = ['ALL', 'ALLOW', 'WARN', 'SLOW', 'BLOCK']

export default function LiveLogs() {
  const [query, setQuery] = useState('')
  const [decisionFilter, setDecisionFilter] = useState('ALL')
  const { data, refresh } = usePolling(() => API.getRecentLogs(100), 3000)

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter(log => {
      const matchesQuery = query === '' ||
        (log.endpoint || '').toLowerCase().includes(query.toLowerCase()) ||
        (log.userName || '').toLowerCase().includes(query.toLowerCase()) ||
        (log.ipAddress || '').includes(query)
      const matchesDecision = decisionFilter === 'ALL' || log.decision === decisionFilter
      return matchesQuery && matchesDecision
    })
  }, [data, query, decisionFilter])

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Live Logs</h1>
          <p className="text-text-secondary mt-1">Every API request, captured and analyzed in real time</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <button onClick={refresh} className="btn-secondary">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </header>

      <ChartCard title="Request stream" subtitle={`${filtered.length} of ${data?.length ?? 0} requests`}>
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search endpoint, user, or IP…"
              className="input pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1 p-1 bg-bg-soft border border-bg-border rounded-lg">
            {DECISION_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setDecisionFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all
                  ${decisionFilter === f
                    ? 'bg-brand text-white'
                    : 'text-text-secondary hover:text-text-primary'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Time</th>
                <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Method</th>
                <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Endpoint</th>
                <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">User</th>
                <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">IP</th>
                <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Time (ms)</th>
                <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Decision</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <Filter className="w-5 h-5 inline mr-2 opacity-50" />
                    No logs match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="border-b border-bg-border hover:bg-bg-soft transition-colors">
                    <td className="py-3 px-2 text-text-muted mono text-xs">{formatTime(log.createdAt || log.timestamp)}</td>
                    <td className="py-3 px-2">
                      <span className="badge-muted mono">{log.method || '—'}</span>
                    </td>
                    <td className="py-3 px-2 mono text-text-primary">{log.endpoint}</td>
                    <td className="py-3 px-2 text-text-secondary">{log.userName || <span className="text-text-muted">—</span>}</td>
                    <td className="py-3 px-2 text-text-muted mono text-xs">{log.ipAddress || '—'}</td>
                    <td className="py-3 px-2"><StatusBadge code={log.statusCode} /></td>
                    <td className="py-3 px-2 text-right text-text-secondary mono">{log.responseTime}</td>
                    <td className="py-3 px-2 text-right"><DecisionBadge value={log.decision} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return String(ts).slice(11, 19) || String(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return String(ts) }
}