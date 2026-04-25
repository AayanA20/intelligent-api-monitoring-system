import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

import Login from './pages/Login'
import Overview from './pages/Overview'
import LiveLogs from './pages/LiveLogs'
import AbuseTimeline from './pages/AbuseTimeline'
import AttackSimulator from './pages/AttackSimulator'
import About from './pages/About'

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

                {/* ADMIN */}
                <Route path="/" element={
                  <RoleRoute allowed={['admin']}>
                    <Overview />
                  </RoleRoute>
                } />

                <Route path="/logs" element={
                  <RoleRoute allowed={['admin']}>
                    <LiveLogs />
                  </RoleRoute>
                } />

                {/* USER */}
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

                {/* COMMON */}
                <Route path="/about" element={<About />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}