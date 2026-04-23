import { Check, AlertTriangle, Clock, Ban, Minus } from 'lucide-react'

const config = {
  ALLOW: { cls: 'badge-success', Icon: Check,          text: 'ALLOW' },
  WARN:  { cls: 'badge-warn',    Icon: AlertTriangle,  text: 'WARN' },
  SLOW:  { cls: 'badge-info',    Icon: Clock,          text: 'SLOW' },
  BLOCK: { cls: 'badge-danger',  Icon: Ban,            text: 'BLOCK' },
}

export default function DecisionBadge({ value }) {
  if (!value) return <span className="badge-muted"><Minus className="w-3 h-3" />—</span>
  const c = config[value] || { cls: 'badge-muted', Icon: Minus, text: value }
  const { cls, Icon, text } = c
  return (
    <span className={cls}>
      <Icon className="w-3 h-3" />
      {text}
    </span>
  )
}