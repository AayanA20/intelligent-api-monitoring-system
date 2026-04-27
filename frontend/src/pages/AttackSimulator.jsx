import { useState, useRef } from 'react'
import {
  Play, Square, Zap, Activity, Repeat, Bot, RefreshCcw, Terminal,
  Database, FolderOpen, Cpu, Shield, AlertTriangle,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import * as API from '../lib/api'
import toast from 'react-hot-toast'

// ── Rule Engine Scenarios ─────────────────────────────────────────────────────
const RULE_SCENARIOS = [
  {
    key: 'NORMAL',
    title: 'Normal Traffic',
    desc: 'Baseline: a realistic pace of requests to /api/normal.',
    expected: 'ALLOW',
    icon: Activity,
    accent: 'success',
    count: 5,
    delayMs: 400,
    callFn: 'callNormal',
    detectedBy: 'rule',
  },
  {
    key: 'EXPENSIVE',
    title: 'Expensive API Abuse',
    desc: 'Repeated calls to /api/heavy — rule: heavyCalls > 5 → SLOW.',
    expected: 'SLOW',
    icon: Zap,
    accent: 'info',
    count: 8,
    delayMs: 200,
    callFn: 'callHeavy',
    detectedBy: 'rule',
  },
  {
    key: 'LOOPING',
    title: 'Endpoint Looping',
    desc: 'Hammering /api/normal — rule: requestCount > 20 → WARN.',
    expected: 'WARN',
    icon: Repeat,
    accent: 'warn',
    count: 25,
    delayMs: 80,
    callFn: 'callNormal',
    detectedBy: 'rule',
  },
  {
    key: 'BOT',
    title: 'Bot-like Flood',
    desc: 'Fixed-interval rapid-fire — rule: requestCount > 50 → BLOCK.',
    expected: 'BLOCK',
    icon: Bot,
    accent: 'danger',
    count: 55,
    delayMs: 30,
    callFn: 'callNormal',
    detectedBy: 'rule',
  },
]

// ── ML Model Scenarios ────────────────────────────────────────────────────────
const ML_SCENARIOS = [
  {
    key: 'SQL',
    title: 'SQL Injection',
    desc: "Injects SQL payloads into URL params — detects SELECT/UNION/OR patterns instantly.",
    expected: 'WARN/BLOCK',
    icon: Database,
    accent: 'danger',
    count: 5,
    delayMs: 300,
    callFn: 'callSQLInjection',
    detectedBy: 'ml',
    example: "?id=1' OR 1=1-- UNION SELECT *",
  },
  {
    key: 'PATH',
    title: 'Path Traversal',
    desc: 'Directory traversal attack — detects ../../etc/passwd and %2e%2e patterns.',
    expected: 'BLOCK',
    icon: FolderOpen,
    accent: 'danger',
    count: 5,
    delayMs: 300,
    callFn: 'callPathTraversal',
    detectedBy: 'ml',
    example: '?path=../../etc/passwd',
  },
  {
    key: 'XSS',
    title: 'XSS Attack',
    desc: 'Cross-site scripting — detects <script>, onerror=, javascript: patterns.',
    expected: 'WARN/BLOCK',
    icon: Cpu,
    accent: 'warn',
    count: 5,
    delayMs: 300,
    callFn: 'callXSSAttack',
    detectedBy: 'ml',
    example: '?q=<script>alert(1)</script>',
  },
]

const ALL_CALLS = {
  callNormal:          API.callNormal,
  callHeavy:           API.callHeavy,
  callSQLInjection:    API.callSQLInjection,
  callPathTraversal:   API.callPathTraversal,
  callXSSAttack:       API.callXSSAttack,
}

export default function AttackSimulator() {
  const [running, setRunning]     = useState(null)
  const [consoleLog, setConsoleLog] = useState([])
  const abortRef = useRef(false)

  const log = (msg, kind = 'info') =>
    setConsoleLog(prev => [...prev.slice(-200), { t: Date.now(), msg, kind }])

  const reset = async () => {
    try {
      await API.resetCounters()
      setConsoleLog([])
      toast.success('Counters reset — clean slate')
    } catch {
      toast.error('Reset failed — is the backend running?')
    }
  }

  const run = async (scenario) => {
    if (running) return
    setRunning(scenario.key)
    abortRef.current = false

    const tag = scenario.detectedBy === 'ml' ? '[ML]' : '[RULE]'
    log(`▶ ${tag} ${scenario.title} — firing ${scenario.count} requests`, 'start')
    if (scenario.example) log(`  Payload: ${scenario.example}`, 'info')

    let allow = 0, warn = 0, slow = 0, block = 0, err = 0
    const callFn = ALL_CALLS[scenario.callFn]

    for (let i = 0; i < scenario.count; i++) {
      if (abortRef.current) { log('■ Aborted by user', 'stop'); break }
      try {
        const res = await callFn()
        if (res?.error === 403) {
          block++
          log(`  [${i + 1}] → 403 BLOCKED`, 'block')
        } else {
          const text = typeof res === 'string' ? res : JSON.stringify(res)
          if      (text.includes('SLOW'))  { slow++;  log(`  [${i + 1}] → SLOW`,  'slow')  }
          else if (text.includes('WARN'))  { warn++;  log(`  [${i + 1}] → WARN`,  'warn')  }
          else if (text.includes('BLOCK')) { block++; log(`  [${i + 1}] → BLOCK`, 'block') }
          else                             { allow++; log(`  [${i + 1}] → ALLOW`, 'allow') }
        }
      } catch (e) {
        err++
        log(`  [${i + 1}] → ERROR ${e.response?.status || ''}`, 'error')
      }
      await sleep(scenario.delayMs)
    }

    log(`✔ Done: ${allow} allow · ${warn} warn · ${slow} slow · ${block} block · ${err} err`, 'done')
    toast.success(`${scenario.title} complete`)
    setRunning(null)
  }

  const stop = () => { abortRef.current = true }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            Attack Simulator
            <span className="badge-danger">DEMO</span>
          </h1>
          <p className="text-text-secondary mt-1">
            Generate controlled attack traffic to showcase detection. Watch Overview or Abuse Timeline.
          </p>
        </div>
        <button onClick={reset} className="btn-secondary" disabled={!!running}>
          <RefreshCcw className="w-4 h-4" /> Reset
        </button>
      </header>

      {/* Rule Engine Scenarios */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-pale border border-brand/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Rule Engine Detection</h2>
            <p className="text-xs text-text-muted">Threshold-based: request count, endpoint frequency, flood detection</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RULE_SCENARIOS.map(s => (
            <ScenarioCard
              key={s.key}
              scenario={s}
              running={running === s.key}
              disabled={running && running !== s.key}
              onRun={() => run(s)}
              onStop={stop}
            />
          ))}
        </div>
      </div>

      {/* ML Model Scenarios */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-danger-light border border-danger/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-danger" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Pattern Detection</h2>
            <p className="text-xs text-text-muted">Content-based: detects attack payloads on first request, before thresholds trigger</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ML_SCENARIOS.map(s => (
            <ScenarioCard
              key={s.key}
              scenario={s}
              running={running === s.key}
              disabled={running && running !== s.key}
              onRun={() => run(s)}
              onStop={stop}
            />
          ))}
        </div>
      </div>

      {/* Console */}
      <ChartCard
        title="Simulator console"
        subtitle="Live output from browser requests"
        right={
          <button onClick={() => setConsoleLog([])} className="btn-secondary text-xs py-1.5 px-3">
            Clear
          </button>
        }
      >
        <div className="h-80 overflow-y-auto bg-slate-900/40 rounded-lg p-4 mono text-xs border border-bg-border">
          {consoleLog.length === 0 ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Terminal className="w-4 h-4" />
              Waiting for scenario…
            </div>
          ) : (
            consoleLog.map((l, i) => (
              <div key={i} className={colorFor(l.kind)}>
                <span className="text-text-muted">[{formatClock(l.t)}]</span> {l.msg}
              </div>
            ))
          )}
        </div>
      </ChartCard>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-brand/20 bg-brand-pale/50">
          <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand" /> Rule Engine Demo
          </h3>
          <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
            <li>Click <strong>Reset</strong> — fresh start.</li>
            <li>Run <strong>Normal Traffic</strong> — charts populate.</li>
            <li>Run <strong>Endpoint Looping</strong> — Overview shows WARN.</li>
            <li>Run <strong>Bot-like Flood</strong> — BLOCK events fill timeline.</li>
          </ol>
        </div>
        <div className="card border-danger/20 bg-danger-light/50">
          <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-danger" /> Pattern Detection Demo
          </h3>
          <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
            <li>Click <strong>Reset</strong> first.</li>
            <li>Run any pattern — detection happens on request <strong>#1</strong>.</li>
            <li>Check <strong>Abuse Timeline</strong> — reason shows detection source.</li>
            <li>Compare: Rule engine needs 20–50 requests; patterns catch immediately.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

function ScenarioCard({ scenario, running, disabled, onRun, onStop }) {
  const { title, desc, expected, icon: Icon, accent, count, delayMs, example, detectedBy } = scenario
  const accents = {
    success: 'border-success/20 bg-success-light/40',
    warn:    'border-warn/20    bg-warn-light/40',
    info:    'border-info/20    bg-info-light/40',
    danger:  'border-danger/20  bg-danger-light/40',
  }
  const iconAccents = {
    success: 'bg-success-light text-success border-success/20',
    warn:    'bg-warn-light    text-warn    border-warn/20',
    info:    'bg-info-light    text-info    border-info/20',
    danger:  'bg-danger-light  text-danger  border-danger/20',
  }
  const badgeCls = {
    success: 'badge-success',
    warn:    'badge-warn',
    info:    'badge-info',
    danger:  'badge-danger',
  }
  return (
    <div className={`card border ${accents[accent]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${iconAccents[accent]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={badgeCls[accent]}>Expected: {expected}</span>
          {detectedBy === 'ml' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-pale text-brand-dark border border-brand/20 uppercase tracking-wide">
              Pattern Based
            </span>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-2">{desc}</p>
      {example && (
        <p className="text-xs mono text-text-muted bg-bg-soft rounded px-2 py-1 mb-3 truncate border border-bg-border">
          {example}
        </p>
      )}
      <div className="flex items-center justify-between mb-4 text-xs text-text-muted">
        <span className="mono">{count} requests</span>
        <span className="mono">{delayMs}ms between</span>
      </div>
      {running ? (
        <button onClick={onStop} className="btn-danger w-full">
          <Square className="w-4 h-4" /> Stop
        </button>
      ) : (
        <button onClick={onRun} disabled={disabled} className="btn-primary w-full">
          <Play className="w-4 h-4" /> Run scenario
        </button>
      )}
    </div>
  )
}

function colorFor(kind) {
  return {
    start: 'text-brand',
    stop:  'text-text-muted',
    done:  'text-success',
    allow: 'text-success',
    warn:  'text-warn',
    slow:  'text-info',
    block: 'text-danger',
    error: 'text-danger',
    info:  'text-text-secondary',
  }[kind] || 'text-text-secondary'
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const formatClock = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })