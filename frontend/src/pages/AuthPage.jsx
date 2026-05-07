import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Mail, ChevronRight, Cpu, Wallet, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/* ── UI Components ── */
function AuthInput({ icon: Icon, label, type, value, onChange, placeholder }) {
  return (
    <div className="space-y-2 group">
      <label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-[#F7931A] transition-colors">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#F7931A] transition-colors">
          <Icon size={16} />
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-zinc-200 font-mono text-sm focus:outline-none focus:border-[#F7931A]/30 focus:bg-zinc-900 transition-all placeholder:text-zinc-700"
        />
      </div>
    </div>
  )
}

export default function AuthPage({ mode: initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const endpoint = mode === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/signup`
    const body = mode === 'login' 
      ? { email, password } 
      : { email, password, name }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (res.ok) {
        if (mode === 'login') {
          localStorage.setItem('halluciguard_user', JSON.stringify(data.user))
          navigate('/history')
        } else {
          setMode('login')
          setError('Account created! Please sign in.')
        }
      } else {
        setError(data.detail || 'Authentication failed')
      }
    } catch (err) {
      setError('Connection error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto relative z-10 mt-24 mb-12">
      
      {/* Decorative Outer Frame */}
      <div className="absolute -inset-1 bg-[#F7931A]/5 rounded-[2.5rem] blur-2xl pointer-events-none" />
      
      <div className="relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl overflow-hidden">
        
        {/* Subtle Scanline Effect */}
        <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />
        
        {/* Header Visual */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-[#F7931A]/5 rounded-full animate-ping" />
            <Shield className="text-[#F7931A] relative z-10" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-[0.3em] text-white text-center uppercase">HalluciGuard</h1>
          <p className="font-mono text-[8px] font-bold text-zinc-500 tracking-[0.4em] uppercase mt-1">Sign in to start checking hallucinations</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
          <button 
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-mono text-[9px] font-black uppercase tracking-widest transition-all ${
              mode === 'login' ? 'bg-[#F7931A] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-mono text-[9px] font-black uppercase tracking-widest transition-all ${
              mode === 'signup' ? 'bg-[#F7931A] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            {mode === 'signup' && (
              <AuthInput 
                icon={Cpu} 
                label="Your Name" 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Full Name"
              />
            )}
            <AuthInput 
              icon={Mail} 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@company.com"
            />
            <AuthInput 
              icon={Lock} 
              label="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••••••"
            />

            {error && (
              <p className="text-[10px] font-mono font-bold text-rose-500 text-center uppercase tracking-widest animate-pulse">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F7931A] to-[#EA580C] py-4 rounded-xl text-white font-black text-[10px] tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(247,147,26,0.3)] hover:shadow-[0_0_50px_rgba(247,147,26,0.5)] hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="mt-6 pt-6 border-t border-white/5" />

        {/* Status Indicators */}
        <div className="mt-6 flex justify-between items-center text-[7px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Encrypted Connection
          </div>
          <div className="flex items-center gap-2">
            <Lock size={10} /> System Ready
          </div>
        </div>
      </div>

      {/* External Footer Metrics removed */}
      <style>{`
        .bg-scanlines {
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(0, 0, 0, 0.5) 50%
          );
          background-size: 100% 4px;
        }
      `}</style>
    </div>
  )
}
