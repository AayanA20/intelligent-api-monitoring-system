import { useState, useMemo } from 'react'
import {
  Activity, Ban, AlertTriangle, Clock, Users, Gauge, TrendingUp, X, Shield, ChevronUp,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import LiveIndicator from '../components/LiveIndicator'
import DecisionBadge from '../components/DecisionBadge'
import { usePolling } from '../hooks/usePolling'
import * as API from '../lib/api'

const DECISION_COLORS = {
  ALLOW: '#10b981',
  WARN:  '#f59e0b',
  SLOW:  '#3b82f6',
  BLOCK: '#ef4444',
}
const STATUS_COLORS = {
  '2': '#10b981', '3': '#3b82f6', '4': '#f59e0b', '5': '#ef4444',
}

// Abuse severity score: BLOCK=3, SLOW=2, WARN=1, ALLOW=0
const SEVERITY = { BLOCK: 3, SLOW: 2, WARN: 1, ALLOW: 0 }

export default function Overview() {
  const [selectedUser, setSelectedUser] = useState(null)

  const { data: stats }     = usePolling(API.getStats, 3000)
  const { data: rpm }       = usePolling(() => API.getRequestsPerMinute(30), 5000)
  const { data: decisions } = usePolling(API.getDecisionDistribution, 5000)
  const { data: statuses }  = usePolling(API.getStatusDistribution, 5000)
  const { data: endpoints } = usePolling(() => API.getTopEndpoints(7), 5000)
  const { data: users }     = usePolling(() => API.getTopUsers(20), 5000)
  const { data: allLogs }   = usePolling(() => API.getRecentLogs(200), 5000)
  const { data: abuseEvts } = usePolling(() => API.getAbuseEvents(200), 5000)

  const decisionData = (decisions || [])
    .filter(d => d.decision)
    .map(d => ({ name: d.decision, value: Number(d.count) }))

  const statusData = (statuses || [])
    .filter(s => s.statusCode)
    .map(s => ({ name: String(s.statusCode), value: Number(s.count) }))

  const endpointData = (endpoints || []).map(e => ({
    name: String(e.endpoint || '').replace('/api/', ''),
    count: Number(e.count),
  }))

  // Build per-user abuse score from abuse events
  const userAbuseScore = useMemo(() => {
    const scores = {}
    ;(abuseEvts || []).forEach(evt => {
      const u = evt.userName || 'anonymous'
      if (!scores[u]) scores[u] = { BLOCK: 0, WARN: 0, SLOW: 0, total: 0 }
      if (scores[u][evt.decision] !== undefined) scores[u][evt.decision]++
      scores[u].total++
    })
    return scores
  }, [abuseEvts])

  // Sort users: most abusive first
  // Score = BLOCK*3 + SLOW*2 + WARN*1, tiebreak by total requests
  const sortedUsers = useMemo(() => {
    if (!users) return []
    return [...users]
      .filter(u => u.user)
      .map(u => ({
        name: String(u.user),
        count: Number(u.count),
        abuse: userAbuseScore[u.user] || { BLOCK: 0, WARN: 0, SLOW: 0, total: 0 },
      }))
      .sort((a, b) => {
        const scoreA = (a.abuse.BLOCK * 3) + (a.abuse.SLOW * 2) + (a.abuse.WARN * 1)
        const scoreB = (b.abuse.BLOCK * 3) + (b.abuse.SLOW * 2) + (b.abuse.WARN * 1)
        if (scoreB !== scoreA) return scoreB - scoreA
        return b.count - a.count
      })
  }, [users, userAbuseScore])

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1">Real-time API traffic and abuse analytics</p>
        </div>
        <LiveIndicator />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Activity}      label="Total Requests" value={stats?.totalRequests ?? '—'} accent="brand" />
        <StatCard icon={TrendingUp}    label="Last Hour"      value={stats?.requestsLastHour ?? '—'} accent="info" />
        <StatCard icon={Users}         label="Active Users"   value={stats?.activeUsers ?? '—'} accent="success" />
        <StatCard icon={AlertTriangle} label="Warned"         value={stats?.warnedRequests ?? 0} accent="warn" />
        <StatCard icon={Clock}         label="Slowed"         value={stats?.slowedRequests ?? 0} accent="info" />
        <StatCard icon={Ban}           label="Blocked"        value={stats?.blockedRequests ?? 0} accent="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Requests per minute" subtitle="Last 30 minutes" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={rpm || []} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="minute" tick={{ fill: '#64748b', fontSize: 11 }} stroke="#334155" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#334155" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#151c2e', border: '1px solid #334155', borderRadius: '10px', fontSize: 13 }}
                       labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2.5} fill="url(#rpmGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Decisions" subtitle="Allow / Warn / Slow / Block">
          {decisionData.length === 0 ? (
            <EmptyState text="No decisions yet — hit some endpoints!" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={decisionData} dataKey="value" nameKey="name"
                     cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {decisionData.map((entry, i) => (
                    <Cell key={i} fill={DECISION_COLORS[entry.name] || '#64748b'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#151c2e', border: '1px solid #334155', borderRadius: '10px', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Top Endpoints" subtitle="By request count" className="lg:col-span-2">
          {endpointData.length === 0 ? (
            <EmptyState text="No endpoint data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={endpointData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} stroke="#334155" />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#334155" allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#151c2e', border: '1px solid #334155', borderRadius: '10px', fontSize: 13 }}
                         cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="HTTP Status" subtitle="Distribution">
          {statusData.length === 0 ? (
            <EmptyState text="No status data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name"
                     cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name[0]] || '#64748b'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#151c2e', border: '1px solid #334155', borderRadius: '10px', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top Users — sorted by abuse severity */}
      <ChartCard
        title="Top Users"
        subtitle="Sorted by abuse severity — click a user to see behaviour"
      >
        {sortedUsers.length === 0 ? (
          <EmptyState text="No user activity yet" />
        ) : (
          <div className="space-y-2">
            {sortedUsers.map((u, i) => {
              const max = Math.max(...sortedUsers.map(x => x.count))
              const pct = (u.count / max) * 100
              const abuseScore = (u.abuse.BLOCK * 3) + (u.abuse.SLOW * 2) + (u.abuse.WARN * 1)
              const isMostAbusive = i === 0 && abuseScore > 0
              return (
                <div
                  key={u.name}
                  onClick={() => setSelectedUser(u.name)}
                  className={`flex items-center gap-4 p-2 rounded-xl cursor-pointer transition-all
                    hover:bg-bg-hover border
                    ${isMostAbusive
                      ? 'border-danger/30 bg-danger/5'
                      : 'border-transparent'}`}
                >
                  {/* Rank badge */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isMostAbusive
                      ? 'bg-danger/20 border border-danger/40 text-danger'
                      : 'bg-brand/15 border border-brand/30 text-brand-light'}`}>
                    {i + 1}
                  </div>

                  {/* Bar + name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{u.name}</span>
                        {isMostAbusive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger/20 text-danger border border-danger/30 uppercase tracking-wide">
                            Most Abusive
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mono">{u.count} req</span>
                    </div>
                    <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all
                          ${abuseScore > 0
                            ? 'bg-gradient-to-r from-warn to-danger'
                            : 'bg-gradient-to-r from-brand to-purple-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Abuse badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {u.abuse.BLOCK > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/25">
                        {u.abuse.BLOCK} BLK
                      </span>
                    )}
                    {u.abuse.WARN > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warn/15 text-warn border border-warn/25">
                        {u.abuse.WARN} WRN
                      </span>
                    )}
                    {u.abuse.SLOW > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-info/15 text-info border border-info/25">
                        {u.abuse.SLOW} SLW
                      </span>
                    )}
                    <ChevronUp className="w-3.5 h-3.5 text-slate-600 rotate-90" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ChartCard>

      {/* User behaviour modal */}
      {selectedUser && (
        <UserModal
          username={selectedUser}
          logs={allLogs || []}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

// ── User Behaviour Modal ──────────────────────────────────────────────────────
function UserModal({ username, logs, onClose }) {
  // Filter logs for this user
  const userLogs = useMemo(() =>
    logs.filter(l => (l.userName || 'anonymous') === username),
    [logs, username]
  )

  // Decision breakdown for donut
  const decisionBreakdown = useMemo(() => {
    const counts = { ALLOW: 0, WARN: 0, SLOW: 0, BLOCK: 0 }
    userLogs.forEach(l => { if (counts[l.decision] !== undefined) counts[l.decision]++ })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
  }, [userLogs])

  // Activity over time — group by minute
  const activityData = useMemo(() => {
    const byMinute = {}
    userLogs.forEach(l => {
      const ts = l.createdAt || l.timestamp
      if (!ts) return
      let key
      try {
        const d = new Date(ts)
        key = isNaN(d.getTime())
          ? String(ts).slice(11, 16)
          : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch { key = String(ts).slice(11, 16) }
      if (!byMinute[key]) byMinute[key] = { time: key, total: 0, ALLOW: 0, WARN: 0, SLOW: 0, BLOCK: 0 }
      byMinute[key].total++
      if (byMinute[key][l.decision] !== undefined) byMinute[key][l.decision]++
    })
    return Object.values(byMinute).slice(-20) // last 20 time points
  }, [userLogs])

  const totalAbuse = userLogs.filter(l => l.decision !== 'ALLOW').length
  const blockCount = userLogs.filter(l => l.decision === 'BLOCK').length
  const warnCount  = userLogs.filter(l => l.decision === 'WARN').length
  const slowCount  = userLogs.filter(l => l.decision === 'SLOW').length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-3xl bg-bg-card border border-slate-700/60 rounded-2xl shadow-2xl animate-fade-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-sm font-bold">
              {username[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">{username}</h2>
              <p className="text-xs text-slate-500">{userLogs.length} total requests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-bg-hover transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-4 gap-px bg-slate-800/60 border-b border-slate-800">
          {[
            { label: 'Total', value: userLogs.length, color: 'text-slate-200' },
            { label: 'Blocked', value: blockCount, color: 'text-danger' },
            { label: 'Warned', value: warnCount, color: 'text-warn' },
            { label: 'Slowed', value: slowCount, color: 'text-info' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-bg-card px-6 py-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Activity line chart — 2/3 width */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Request Activity Over Time
            </p>
            {activityData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                No activity data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="allowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="warnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="blockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} stroke="#334155" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#334155" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#151c2e', border: '1px solid #334155', borderRadius: '10px', fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="ALLOW" stroke="#10b981" strokeWidth={2} fill="url(#allowGrad)" stackId="1" />
                  <Area type="monotone" dataKey="WARN"  stroke="#f59e0b" strokeWidth={2} fill="url(#warnGrad)"  stackId="1" />
                  <Area type="monotone" dataKey="BLOCK" stroke="#ef4444" strokeWidth={2} fill="url(#blockGrad)" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Decision donut — 1/3 width */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Decision Breakdown
            </p>
            {decisionBreakdown.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm text-center">
                No decisions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={decisionBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {decisionBreakdown.map((entry, i) => (
                      <Cell key={i} fill={DECISION_COLORS[entry.name] || '#64748b'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#151c2e', border: '1px solid #334155', borderRadius: '10px', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent events for this user */}
        <div className="px-6 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Recent Events
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {userLogs.slice(0, 10).map((log, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-soft border border-slate-800/60 text-xs">
                <DecisionBadge value={log.decision} />
                <span className="mono text-slate-300 flex-1 truncate">{log.endpoint}</span>
                <span className="text-slate-500 mono">{log.responseTime}ms</span>
                <span className="text-slate-600 mono">{formatTime(log.createdAt || log.timestamp)}</span>
              </div>
            ))}
            {userLogs.length === 0 && (
              <p className="text-center text-slate-500 py-4">No recent logs for this user</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
      <Gauge className="w-5 h-5 mr-2 opacity-50" />
      {text}
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