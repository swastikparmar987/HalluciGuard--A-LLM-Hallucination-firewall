import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { 
  Layout, BarChart3, Settings, 
  User, Plus, LogOut, Shield, ChevronRight, X, Search
} from 'lucide-react'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import SettingsPage from './pages/Settings'

// --- PROTECTED ROUTE COMPONENT ---
function ProtectedRoute({ children }) {
  const user = localStorage.getItem('halluciguard_user')
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const isLandingPage = location.pathname === '/'

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('halluciguard_user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Failed to parse user session:', err)
      localStorage.removeItem('halluciguard_user')
    }
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem('halluciguard_user')
    setUser(null)
    navigate('/')
  }

  // --- LANDING PAGE / AUTH PAGE LAYOUT ---
  if (isLandingPage || isAuthPage) {
    return (
      <div className="bg-[#030304] text-[#e5e2e1] min-h-screen relative flex flex-col font-['Inter'] overflow-x-clip">
        <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] rounded-full border border-orange-500/20 bg-[#0F1115]/15 backdrop-blur-md shadow-[0_0_30px_rgba(247,147,26,0.15)] z-50">
          <div className="flex justify-between items-center px-10 py-4 max-w-7xl mx-auto border border-[#F7931A]/10 rounded-full">
            <Link to="/" className="text-xl font-black tracking-widest text-[#F7931A]">HALLUCIGUARD</Link>
            <nav className="hidden md:flex items-center gap-8">
              <NavLink to="/chat" className="font-mono text-[11px] font-bold text-zinc-400 hover:text-[#F7931A] uppercase tracking-widest transition-all">Launch Chat</NavLink>
              <NavLink to="/login" className="font-mono text-[11px] font-bold text-zinc-400 hover:text-[#F7931A] uppercase tracking-widest transition-all">Sign In</NavLink>
            </nav>
            <Link to="/signup" className="bg-gradient-to-r from-[#F7931A] to-[#EA580C] text-white font-mono text-[10px] font-bold px-6 py-2 rounded-full uppercase shadow-[0_0_15px_rgba(247,147,26,0.3)] transition-all">Sign Up</Link>
          </div>
        </header>

        <main className={`relative z-10 flex-grow flex flex-col items-center w-full ${isAuthPage ? 'justify-center min-h-screen' : 'pt-32 pb-20'}`}>
          {children}
        </main>
      </div>
    )
  }

  // Auto-generated avatar based on user email (guaranteed unique)
  const avatarUrl = user?.email 
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}&backgroundColor=0a0a0a` 
    : `https://api.dicebear.com/7.x/bottts/svg?seed=Guest&backgroundColor=0a0a0a`

  // --- APP LAYOUT (CHAT, HISTORY, SETTINGS) ---
  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#e5e2e1] font-['Inter'] overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        border-r border-[#1f1f1f] bg-[#0a0a0a] flex flex-col py-6 shrink-0 transition-all duration-300 relative z-50
      `}>
        <div className="px-6 mb-10 flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full border border-[#F7931A]/30 overflow-hidden shrink-0">
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in whitespace-nowrap">
              <h2 className="font-['Space_Grotesk'] font-bold text-xs text-[#f1ffef] uppercase tracking-widest">{user?.name || 'User'}</h2>
              <p className="font-mono text-[8px] text-[#F7931A]/60 uppercase">Verified Account</p>
            </div>
          )}
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={() => navigate('/chat')}
            className={`
              w-full bg-[#F7931A] text-black font-['Space_Grotesk'] font-bold text-xs py-3 rounded-sm 
              hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95
              ${!sidebarOpen ? 'px-0' : 'px-4'}
            `}
          >
            <Plus size={18} strokeWidth={3} />
            {sidebarOpen && <span>NEW CHAT</span>}
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {[
            { name: 'Chat', path: '/chat', icon: Layout },
            { name: 'History', path: '/history', icon: BarChart3 },
            { name: 'Settings', path: '/settings', icon: Settings },
          ].map((item) => (
            <NavLink 
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-6 py-3 transition-all relative
                ${isActive 
                  ? 'bg-[#121212] text-[#F7931A] border-l-4 border-[#F7931A]' 
                  : 'text-white/40 hover:bg-[#121212] hover:text-white'
                }
              `}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-['Space_Grotesk'] text-sm uppercase tracking-wider">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 pt-6 border-t border-[#1f1f1f]">
          <button onClick={handleLogout} className="text-rose-500/60 px-6 py-3 flex items-center gap-4 hover:bg-rose-500/5 hover:text-rose-500 transition-all text-left">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-['Space_Grotesk'] text-sm uppercase tracking-wider">Log Out</span>}
          </button>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-[#1f1f1f] border border-white/10 rounded-full p-1 text-zinc-500 hover:text-white transition-colors z-50"
        >
          {sidebarOpen ? <X size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {children}
      </main>

    </div>
  )
}

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          
          {/* Protected Routes */}
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Navigate to="/history" replace />} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </AppShell>
    </Router>
  )
}

export default App
