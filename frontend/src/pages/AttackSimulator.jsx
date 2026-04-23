import { useState, useRef } from 'react'
import {
  Play, Square, Zap, Activity, Repeat, Bot, RefreshCcw, Terminal,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import * as API from '../lib/api'
import toast from 'react-hot-toast'

const SCENARIOS = [
  {
    key: 'NORMAL',
    title: 'Normal Traffic',
    desc: 'Baseline: a realistic pace of requests to /api/normal.',
    expected: 'ALLOW',
    icon: Activity,
    accent: 'success',
    count: 5,
    delayMs: 400,
    target: 'normal',
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
    target: 'heavy',
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
    target: 'normal',
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
    target: 'normal',
  },
]

export default function AttackSimulator() {
  const [running, setRunning] = useState(null)
  const [consoleLog, setConsoleLog] = useState([])
  const abortRef = useRef(false)

  const log = (msg, kind = 'info') => {
    setConsoleLog(prev => [...prev.slice(-200), { t: Date.now(), msg, kind }])
  }

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
    log(`▶ ${scenario.title} — firing ${scenario.count} requests to /api/${scenario.target}`, 'start')

    let allow = 0, warn = 0, slow = 0, block = 0, err = 0

    for (let i = 0; i < scenario.count; i++) {
      if (abortRef.current) {
        log('■ Aborted by user', 'stop')
        break
      }
      try {
        const call = scenario.target === 'heavy' ? API.callHeavy : API.callNormal
        const res = await call()

        if (res?.error === 403) {
          block++
          log(`  [${i + 1}] → 403 BLOCKED`, 'block')
        } else {
          const text = typeof res === 'string' ? res : JSON.stringify(res)
          if (text.includes('SLOW'))       { slow++;  log(`  [${i + 1}] → SLOW`,  'slow') }
          else if (text.includes('WARN'))  { warn++;  log(`  [${i + 1}] → WARN`,  'warn') }
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Attack Simulator
            <span className="badge-danger">DEMO</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Generate controlled abuse traffic to showcase detection in real time.
            Watch the Overview or Abuse Timeline tab while you run these.
          </p>
        </div>
        <button onClick={reset} className="btn-secondary" disabled={!!running}>
          <RefreshCcw className="w-4 h-4" /> Reset counters
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCENARIOS.map(s => (
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

      <ChartCard
        title="Simulator console"
        subtitle="Live output from the browser's requests"
        right={
          <button onClick={() => setConsoleLog([])} className="btn-secondary text-xs py-1.5 px-3">
            Clear
          </button>
        }
      >
        <div className="h-80 overflow-y-auto bg-black/40 rounded-lg p-4 mono text-xs border border-slate-800">
          {consoleLog.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Terminal className="w-4 h-4" />
              Waiting for scenario…
            </div>
          ) : (
            consoleLog.map((l, i) => (
              <div key={i} className={colorFor(l.kind)}>
                <span className="text-slate-600">[{formatClock(l.t)}]</span> {l.msg}
              </div>
            ))
          )}
        </div>
      </ChartCard>

      <div className="card border-brand/30 bg-brand/5">
        <h3 className="font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-light" /> Demo tip
        </h3>
        <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
          <li>Open the Overview tab in one browser window.</li>
          <li>Open this Simulator tab in another window (or a second monitor).</li>
          <li>Click <strong>Reset counters</strong> — fresh start.</li>
          <li>Run <strong>Normal Traffic</strong> first — show charts populating.</li>
          <li>Run <strong>Endpoint Looping</strong> — Overview lights up with WARN.</li>
          <li>Run <strong>Bot-like Flood</strong> — Overview shows BLOCK, Abuse Timeline fills up.</li>
        </ol>
      </div>
    </div>
  )
}

function ScenarioCard({ scenario, running, disabled, onRun, onStop }) {
  const { title, desc, expected, icon: Icon, accent, count, delayMs } = scenario
  const accents = {
    success: 'border-success/30 bg-success/5',
    warn:    'border-warn/30    bg-warn/5',
    info:    'border-info/30    bg-info/5',
    danger:  'border-danger/30  bg-danger/5',
  }
  const iconAccents = {
    success: 'bg-success/10 text-success border-success/30',
    warn:    'bg-warn/10    text-warn    border-warn/30',
    info:    'bg-info/10    text-info    border-info/30',
    danger:  'bg-danger/10  text-danger  border-danger/30',
  }
  return (
    <div className={`card border ${accents[accent]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${iconAccents[accent]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`badge badge-${accent === 'success' ? 'success' : accent === 'info' ? 'info' : accent === 'warn' ? 'warn' : 'danger'}`}>
          Expected: {expected}
        </span>
      </div>
      <h3 className="font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{desc}</p>
      <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
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
    start: 'text-brand-light',
    stop:  'text-slate-500',
    done:  'text-success',
    allow: 'text-success',
    warn:  'text-warn',
    slow:  'text-info',
    block: 'text-danger',
    error: 'text-danger',
    info:  'text-slate-400',
  }[kind] || 'text-slate-400'
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const formatClock = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })