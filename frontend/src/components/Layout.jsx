import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, ShieldAlert, Zap, Info, LogOut, ShieldCheck, Circle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const onLogout = () => {
    logout()
    toast.success('Logged out')
    nav('/login')
  }

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
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-72 bg-bg-card border-r border-bg-border flex flex-col fixed h-screen shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center glow">
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-text-primary">API Guardian</h1>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                Security Monitor
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
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
                     ? 'bg-brand/10 text-brand border border-brand/20 shadow-soft'
                     : 'text-text-secondary hover:text-text-primary hover:bg-bg-soft border border-transparent'
                 }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-bg-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-sm font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {user?.username}
              </p>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 fill-success text-success" />
                Online
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8">
        <div className="max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}