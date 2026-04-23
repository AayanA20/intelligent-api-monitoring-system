import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Activity, Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { login, register } = useAuth()
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(username, password)
        toast.success(`Welcome back, ${username}`)
      } else {
        await register(username, password)
        toast.success(`Account created for ${username}`)
      }
      nav('/')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error
                || (err.response?.status === 401 ? 'Invalid credentials'
                  : err.response?.status === 409 ? 'Username already exists'
                  : 'Something went wrong')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-bg-soft via-bg to-bg-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center glow">
              <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-xl">API Guardian</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Abuse Detection</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Intelligent API Usage<br />
              <span className="gradient-text">Monitoring & Abuse Detection</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Real-time behavior analysis, rule-based detection, and ML-powered
              anomaly scoring for modern backend services.
            </p>
          </div>

          <div className="space-y-4">
            <Feature icon={Activity} title="Live traffic monitoring"
                     desc="Every request is captured, scored, and persisted." />
            <Feature icon={ShieldCheck} title="Behavioral rule engine"
                     desc="Detects endpoint looping, expensive-API abuse, and bots." />
            <Feature icon={Zap} title="Intelligent responses"
                     desc="Warn, slow down, or block abusive users automatically." />
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          Minor Project · JK Lakshmipat University
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">API Guardian</h1>
          </div>

          <h2 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-slate-400 mb-8">
            {mode === 'login'
              ? 'Sign in to access the monitoring dashboard.'
              : 'Register a new user — stored in memory for this demo.'}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Username
              </label>
              <input
                type="text"
                className="input"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button onClick={() => setMode('register')} className="text-brand-light hover:underline font-medium">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-brand-light hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-10 p-4 rounded-lg bg-bg-soft border border-slate-800/60">
            <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Demo credentials</p>
            <p className="text-sm mono text-slate-300">admin / password</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-brand-light" />
      </div>
      <div>
        <h4 className="font-semibold text-slate-200">{title}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  )
}