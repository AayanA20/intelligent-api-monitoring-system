import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#151c2e',
              color: '#e2e8f0',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#151c2e' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#151c2e' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)