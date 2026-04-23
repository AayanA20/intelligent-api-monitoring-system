import {
  Activity, Ban, AlertTriangle, Clock, Users, Gauge, TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import LiveIndicator from '../components/LiveIndicator'
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

export default function Overview() {
  const { data: stats }     = usePolling(API.getStats, 3000)
  const { data: rpm }       = usePolling(() => API.getRequestsPerMinute(30), 5000)
  const { data: decisions } = usePolling(API.getDecisionDistribution, 5000)
  const { data: statuses }  = usePolling(API.getStatusDistribution, 5000)
  const { data: endpoints } = usePolling(() => API.getTopEndpoints(7), 5000)
  const { data: users }     = usePolling(() => API.getTopUsers(7), 5000)

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

  const userData = (users || [])
    .filter(u => u.user)
    .map(u => ({ name: String(u.user), count: Number(u.count) }))

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

      <ChartCard title="Top Users" subtitle="Most active by request count">
        {userData.length === 0 ? (
          <EmptyState text="No user activity yet" />
        ) : (
          <div className="space-y-2">
            {userData.map((u, i) => {
              const max = Math.max(...userData.map(x => x.count))
              const pct = (u.count / max) * 100
              return (
                <div key={u.name} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-brand/15 border border-brand/30
                                  flex items-center justify-center text-xs font-bold text-brand-light">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate">{u.name}</span>
                      <span className="text-xs text-slate-400 mono">{u.count} req</span>
                    </div>
                    <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all"
                           style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ChartCard>
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