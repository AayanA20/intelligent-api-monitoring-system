export default function ChartCard({ title, subtitle, children, right, className = '' }) {
  return (
    <div className={`card animate-fade-in ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}