export default function StatusBadge({ code }) {
  if (code == null) return <span className="badge-muted">—</span>
  const n = Number(code)
  let cls = 'badge-muted'
  if (n >= 200 && n < 300) cls = 'badge-success'
  else if (n >= 300 && n < 400) cls = 'badge-info'
  else if (n >= 400 && n < 500) cls = 'badge-warn'
  else if (n >= 500) cls = 'badge-danger'
  return <span className={cls}>{code}</span>
}