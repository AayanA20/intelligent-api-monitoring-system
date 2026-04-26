import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Overview from './pages/Overview'
import LiveLogs from './pages/LiveLogs'
import AbuseTimeline from './pages/AbuseTimeline'
import AttackSimulator from './pages/AttackSimulator'
import About from './pages/About'

/** When user lands on "/", send them to the right home for their role. */
function RoleHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin'
    ? <Overview />
    : <Navigate to="/abuse" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Role-aware home */}
                <Route path="/" element={<RoleHome />} />

                {/* ADMIN-ONLY */}
                <Route path="/logs" element={
                  <RoleRoute allowed={['admin']}>
                    <LiveLogs />
                  </RoleRoute>
                } />

                {/* USER-ONLY */}
                <Route path="/abuse" element={
                  <RoleRoute allowed={['user']}>
                    <AbuseTimeline />
                  </RoleRoute>
                } />

                <Route path="/simulator" element={
                  <RoleRoute allowed={['user']}>
                    <AttackSimulator />
                  </RoleRoute>
                } />

                {/* Both roles can see About */}
                <Route path="/about" element={<About />} />

                {/* Anything else -> home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}