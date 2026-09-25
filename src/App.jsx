import { Routes, Route, Navigate } from 'react-router'
import Home from './Pages/Home'
import Login from './Pages/Login'
import AuthCallback from './Pages/AuthCallback'
import './App.css'

// No auth guard yet so every screen can be previewed. Once wired, redirect
// to /login when there is no token (and on any 401).
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
