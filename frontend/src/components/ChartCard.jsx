export default function ChartCard({ title, subtitle, children, right, className = '' }) {
  return (
    <div className={`card animate-fade-in ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}