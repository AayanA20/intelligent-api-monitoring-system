export default function StatCard({ icon: Icon, label, value, accent = 'brand', trend }) {
  const accents = {
    brand:   'text-brand-light   bg-brand/10   border-brand/20',
    success: 'text-success       bg-success/10 border-success/20',
    warn:    'text-warn          bg-warn/10    border-warn/20',
    danger:  'text-danger        bg-danger/10  border-danger/20',
    info:    'text-info          bg-info/10    border-info/20',
  }
  return (
    <div className="card card-hover animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${accents[accent]}`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">{label}</p>
      <p className="text-3xl font-bold tracking-tight">{value ?? '—'}</p>
    </div>
  )
}