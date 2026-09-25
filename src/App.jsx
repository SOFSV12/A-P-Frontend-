import { Routes, Route, Navigate } from 'react-router'
import Home from './Pages/Home'
import Login from './Pages/Login'
import AuthCallback from './Pages/AuthCallback'
import { getToken } from './lib/auth'
import './App.css'

// A 401 from the API also clears the token and redirects to /login (lib/api.js).
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function GuestOnly({ children }) {
  return getToken() ? <Navigate to="/" replace /> : children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
