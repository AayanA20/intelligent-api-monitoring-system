import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, ShieldAlert, Zap, Info, LogOut, ShieldCheck, Circle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Layout({ children }) {
  const { user, logout } = useAuth()   // ✅ correct place
  const nav = useNavigate()

  const onLogout = () => {
    logout()
    toast.success('Logged out')
    nav('/login')
  }

  // ✅ navItems MUST be inside component
  const navItems = user?.role === 'admin'
    ? [
        { to: '/', label: 'Overview', icon: LayoutDashboard },
        { to: '/logs', label: 'Live Logs', icon: Activity },
        { to: '/about', label: 'About', icon: Info },
      ]
    : [
        { to: '/abuse', label: 'Abuse Timeline', icon: ShieldAlert },
        { to: '/simulator', label: 'Attack Simulator', icon: Zap },
        { to: '/about', label: 'About', icon: Info },
      ]

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-bg-soft border-r border-slate-800/60 flex flex-col fixed h-screen">
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center glow">
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">API Guardian</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Abuse Detection
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                 ${
                   isActive
                     ? 'bg-brand/15 text-brand-light border border-brand/20'
                     : 'text-slate-400 hover:text-slate-200 hover:bg-bg-hover border border-transparent'
                 }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.username}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 fill-success text-success dot-pulse" />
                Online
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 max-w-[1600px]">
        {children}
      </main>
    </div>
  )
}