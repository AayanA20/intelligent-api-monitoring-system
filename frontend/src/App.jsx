import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
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
                <Route path="/"          element={<Overview />} />
                <Route path="/logs"      element={<LiveLogs />} />
                <Route path="/abuse"     element={<AbuseTimeline />} />
                <Route path="/simulator" element={<AttackSimulator />} />
                <Route path="/about"     element={<About />} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}